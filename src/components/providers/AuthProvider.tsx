'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getCurrentUserAction, signOut } from '@/lib/auth/actions';

interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string | null;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUserAction();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          user_metadata: {
            full_name: currentUser.profile?.fullName ?? currentUser.fullName,
          },
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleAuthChange = () => {
      fetchUser();
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    // signOut redirects, so no need to refetch here
  };

  const value: AuthContextType = {
    user,
    isLoading,
    refreshUser: fetchUser,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}
