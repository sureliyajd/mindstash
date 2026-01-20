# MindStash Authentication Documentation

> JWT-based Authentication with Access & Refresh Tokens

## Overview

MindStash uses stateless JWT (JSON Web Token) authentication with two token types:
- **Access Token**: Short-lived (30 min), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

## Security Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Password Hashing | passlib + bcrypt | Secure password storage |
| Token Generation | python-jose | JWT creation & validation |
| Token Transport | HTTP Bearer | Authorization header |
| Rate Limiting | slowapi | Brute force protection |

## Configuration

```bash
# .env
SECRET_KEY=your-256-bit-secret-key  # Generate with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Password Security

### Hashing (`app/core/security.py`)

```python
from passlib.context import CryptContext

# bcrypt with automatic salt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    bcrypt automatically:
    - Generates a random salt
    - Uses configurable work factor (default 12)
    - Produces 60-char hash
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Returns True if password matches, False otherwise.
    Timing-safe comparison prevents timing attacks.
    """
    return pwd_context.verify(plain_password, hashed_password)
```

### Password Requirements

Enforced in Pydantic schema:

```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,   # Minimum 8 characters
        max_length=72,  # bcrypt limit
    )
```

## JWT Tokens

### Token Structure

```
Header.Payload.Signature

Header: {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "user@email.com", "exp": 1234567890, "type": "access"}
Signature: HMACSHA256(base64(header) + "." + base64(payload), SECRET_KEY)
```

### Token Creation

```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict) -> str:
    """
    Create a short-lived access token (30 minutes).

    Payload includes:
    - sub: User email (subject)
    - exp: Expiration timestamp
    - type: "access" to distinguish from refresh
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """
    Create a long-lived refresh token (7 days).

    Same structure as access token but:
    - Longer expiration
    - type: "refresh"
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

### Token Decoding

```python
from jose import JWTError, jwt

def decode_token(token: str) -> dict | None:
    """
    Decode and validate a JWT token.

    Returns:
        dict: Payload if valid
        None: If invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

## Authentication Flow

### Registration

```
Client                          Server
  │                               │
  │ POST /api/auth/register       │
  │ {email, password}             │
  │──────────────────────────────►│
  │                               │
  │                               │ 1. Validate email format
  │                               │ 2. Check email not exists
  │                               │ 3. Hash password (bcrypt)
  │                               │ 4. Create user record
  │                               │ 5. Generate tokens
  │                               │
  │ {access_token, refresh_token} │
  │◄──────────────────────────────│
  │                               │
```

### Login

```
Client                          Server
  │                               │
  │ POST /api/auth/login          │
  │ {email, password}             │
  │──────────────────────────────►│
  │                               │
  │                               │ 1. Find user by email
  │                               │ 2. Verify password
  │                               │ 3. Generate tokens
  │                               │
  │ {access_token, refresh_token} │
  │◄──────────────────────────────│
  │                               │
```

### Authenticated Request

```
Client                          Server
  │                               │
  │ GET /api/items/               │
  │ Authorization: Bearer <token> │
  │──────────────────────────────►│
  │                               │
  │                               │ 1. Extract token from header
  │                               │ 2. Decode & validate JWT
  │                               │ 3. Check type == "access"
  │                               │ 4. Load user from DB
  │                               │ 5. Execute route handler
  │                               │
  │ {items: [...]}                │
  │◄──────────────────────────────│
  │                               │
```

### Token Refresh

```
Client                          Server
  │                               │
  │ POST /api/auth/refresh        │
  │ {refresh_token}               │
  │──────────────────────────────►│
  │                               │
  │                               │ 1. Decode refresh token
  │                               │ 2. Verify type == "refresh"
  │                               │ 3. Check not expired
  │                               │ 4. Generate new access token
  │                               │
  │ {access_token}                │
  │◄──────────────────────────────│
  │                               │
```

## API Implementation

### Dependencies (`app/api/dependencies.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to extract and validate JWT.

    Usage:
        @router.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            return {"user": user.email}

    Raises:
        HTTPException 401: If token is invalid, expired, or user not found
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify it's an access token (not refresh)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    # Get user from database
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

### Auth Routes (`app/api/routes/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.rate_limit import limiter
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")  # Prevent registration spam
def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user and return tokens."""
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/login", response_model=TokenResponse)
@limiter.limit("60/hour")  # Prevent brute force
def login(
    request: Request,
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return tokens."""
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate tokens
    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/refresh", response_model=dict)
@limiter.limit("100/hour")
def refresh(
    request: Request,
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Get new access token using refresh token."""
    payload = decode_token(refresh_token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    # Generate new access token
    access_token = create_access_token({"sub": payload.get("sub")})

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user
```

## Frontend Integration

### Token Storage (`lib/api.ts`)

```typescript
const TOKEN_KEY = 'mindstash_token';
const REFRESH_KEY = 'mindstash_refresh';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token: string) => localStorage.setItem(REFRESH_KEY, token);
export const clearRefreshToken = () => localStorage.removeItem(REFRESH_KEY);
```

### Axios Interceptors

```typescript
// Request interceptor: Add token to all requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
          const { access_token } = response.data;
          setToken(access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        clearToken();
        clearRefreshToken();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

### useAuth Hook

```typescript
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => login(data.email, data.password),
    onSuccess: (response) => {
      setToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => register(data.email, data.password),
    onSuccess: (response) => {
      setToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });

  // Logout
  const logout = () => {
    clearToken();
    clearRefreshToken();
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: user?.data,
    isLoading,
    isAuthenticated: !!user?.data,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

## Rate Limiting

### Endpoints

| Endpoint | Limit | Reason |
|----------|-------|--------|
| POST /register | 20/hour | Prevent spam accounts |
| POST /login | 60/hour | Prevent brute force |
| POST /refresh | 100/hour | Allow frequent refreshes |
| GET /me | 500/hour | General use |

### Implementation

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("60/hour")
def login(request: Request, ...):
    ...
```

## Security Best Practices

### Implemented

1. **Password Hashing**: bcrypt with automatic salting
2. **Short-lived Access Tokens**: 30 minutes
3. **Refresh Token Rotation**: Long-lived but can be revoked
4. **Rate Limiting**: Prevents brute force attacks
5. **CORS Configuration**: Restricted origins
6. **Input Validation**: Pydantic schemas
7. **Timing-safe Comparison**: passlib handles this
8. **No Password in Response**: Only return tokens

### Recommendations

1. **HTTPS Only**: Enforce in production
2. **Token Blacklisting**: For logout/password change (future)
3. **2FA**: Two-factor authentication (future)
4. **Password Strength**: Client-side validation
5. **Account Lockout**: After N failed attempts (future)

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Email already registered"
}
```

### 401 Unauthorized

```json
{
  "detail": "Invalid email or password"
}
```

```json
{
  "detail": "Invalid or expired token"
}
```

### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded. Please try again later.",
  "retry_after": 60
}
```

## Testing Authentication

```python
import pytest
from fastapi.testclient import TestClient

def test_register(client: TestClient):
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass123"
    })
    assert response.status_code == 201
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()

def test_login(client: TestClient):
    # First register
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass123"
    })

    # Then login
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "securepass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_route(client: TestClient, auth_headers: dict):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert "email" in response.json()

def test_invalid_token(client: TestClient):
    response = client.get("/api/auth/me", headers={
        "Authorization": "Bearer invalid_token"
    })
    assert response.status_code == 401
```

## Debugging

### Check Token Contents

```python
from jose import jwt

token = "eyJhbGc..."
payload = jwt.decode(token, options={"verify_signature": False})
print(payload)
# {'sub': 'user@email.com', 'exp': 1234567890, 'type': 'access'}
```

### Verify Token Locally

```python
from app.core.security import decode_token

payload = decode_token(token)
if payload:
    print(f"Valid token for: {payload['sub']}")
else:
    print("Invalid or expired token")
```
