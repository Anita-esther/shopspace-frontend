import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string | null;
  matric_number: string | null;
  profile_image: string | null;
  role: 'student' | 'admin';
  status: 'active' | 'suspended';
}

interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  matric_number?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (input: Partial<Pick<User, 'full_name' | 'phone_number' | 'matric_number' | 'profile_image'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'shopspace_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    try {
      const res = await api.get<{ user: User }>('/auth/me', { auth: true });
      setUser(res.user);
    } catch {
      // Token invalid/expired — clear it out
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      if (token) {
        await loadCurrentUser();
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (input: RegisterInput) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', input);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) await loadCurrentUser();
  };

  const updateProfile = async (
    input: Partial<Pick<User, 'full_name' | 'phone_number' | 'matric_number' | 'profile_image'>>
  ) => {
    const res = await api.put<{ user: User }>('/auth/me', input, { auth: true });
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
