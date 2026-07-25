import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, senha: string) {
    const response = await authApi.login(email, senha);
    localStorage.setItem('token', response.token);
    setUser({ id: response.id, nome: response.nome, email: response.email, role: response.role });
  }

  async function register(nome: string, email: string, senha: string) {
    const response = await authApi.register(nome, email, senha);
    localStorage.setItem('token', response.token);
    setUser({ id: response.id, nome: response.nome, email: response.email, role: response.role });
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}
