'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { auth, getToken, clearToken, User, TokenResponse } from '../api';

const USER_QUERY_KEY = ['user'];

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch current user if token exists
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<User | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      try {
        return await auth.getCurrentUser();
      } catch {
        clearToken();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation<TokenResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => auth.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });

  // Register mutation
  const registerMutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => auth.register(email, password),
  });

  const login = async (email: string, password: string): Promise<TokenResponse> => {
    return loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string): Promise<User> => {
    return registerMutation.mutateAsync({ email, password });
  };

  const logout = (): void => {
    auth.logout();
    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !isError,
    login,
    register,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  };
}
