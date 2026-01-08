#!/bin/bash

# MindStash - Initial Setup Script
# This script sets up the development environment

set -e  # Exit on error

echo "🚀 MindStash Setup Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${BLUE}Checking Python version...${NC}"
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then 
    echo -e "${YELLOW}Warning: Python 3.11+ recommended. You have: $python_version${NC}"
else
    echo -e "${GREEN}✓ Python version OK: $python_version${NC}"
fi

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo -e "${GREEN}✓ Node.js version: $node_version${NC}"
else
    echo -e "${YELLOW}⚠ Node.js not found. Please install Node.js 18+${NC}"
fi

# Backend Setup
echo ""
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

cd ..

# Frontend Setup
echo ""
echo -e "${BLUE}Setting up Frontend...${NC}"
cd frontend

# Check if package.json exists
if [ -f "package.json" ]; then
    echo "Installing Node dependencies..."
    npm install
    echo -e "${GREEN}✓ Node dependencies installed${NC}"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        echo "Creating .env.local file..."
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
        echo -e "${GREEN}✓ .env.local created${NC}"
    else
        echo -e "${GREEN}✓ .env.local already exists${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Frontend not initialized yet. Run 'npx create-next-app@latest .' in frontend/${NC}"
fi

cd ..

# Summary
echo ""
echo -e "${GREEN}=============================="
echo "✅ Setup Complete!"
echo "==============================${NC}"
echo ""
echo "Next Steps:"
echo "1. Edit backend/.env with your database URL and API keys"
echo "2. Start backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "3. Start frontend: cd frontend && npm run dev"
echo ""
echo "Documentation:"
echo "- README: ./README.md"
echo "- Week 1 Guide: ./docs/week-1-guide.md"
echo ""
echo -e "${BLUE}Happy coding! 🎉${NC}"
