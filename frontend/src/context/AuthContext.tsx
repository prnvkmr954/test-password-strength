'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type User = {
  username: string;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  loginUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loginUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('auth_user');
      }
    }
  }, []);

  const loginUser = useCallback((u: User) => {
    setUser(u);
    sessionStorage.setItem('auth_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('auth_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
