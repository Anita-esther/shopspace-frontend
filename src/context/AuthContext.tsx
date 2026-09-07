import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  matric_number: string | null;
  profile_image: string | null;
  role: 'user' | 'admin';
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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (input: Partial<Pick<User, 'full_name' | 'phone_number' | 'matric_number' | 'profile_image'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Loads (or waits for) the public.users profile row for a given auth user id.
  // Right after sign-up the handle_new_user trigger may not have committed
  // yet, so we retry briefly instead of failing outright.
  const loadProfile = async (userId: string): Promise<User | null> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) return data as User;
      if (error && attempt === 4) throw error;
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id).catch(() => null);
        if (mounted) setUser(profile);
      }
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id).catch(() => null);
        if (mounted) setUser(profile);
      } else {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) {
      const profile = await loadProfile(data.user.id);
      if (profile?.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('This account has been suspended');
      }
      setUser(profile);
    }
  };

  const register = async (input: RegisterInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.full_name,
          phone_number: input.phone_number || null,
          matric_number: input.matric_number || null,
        },
      },
    });
    if (error) throw new Error(error.message);
    if (data.user) {
      const profile = await loadProfile(data.user.id);
      setUser(profile);
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await loadProfile(session.user.id);
      setUser(profile);
    }
  };

  const updateProfile = async (
    input: Partial<Pick<User, 'full_name' | 'phone_number' | 'matric_number' | 'profile_image'>>
  ) => {
    if (!user) throw new Error('Not signed in');
    const { data, error } = await supabase
      .from('users')
      .update(input)
      .eq('user_id', user.user_id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setUser(data as User);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
