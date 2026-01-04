'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  avatar: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  updateDisplayName: (name: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Сначала подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            await setUserFromSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Затем проверяем текущую сессию
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Init auth - session:', session?.user?.email, 'error:', error);
        
        if (mounted && session?.user) {
          await setUserFromSession(session);
        }
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserFromSession = async (session: Session) => {
    const { user: supaUser } = session;
    
    // Получаем профиль пользователя
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, avatar')
      .eq('id', supaUser.id)
      .single();

    setUser({
      uid: supaUser.id,
      email: supaUser.email || null,
      displayName: profile?.display_name || supaUser.user_metadata?.display_name || null,
      avatar: profile?.avatar || null,
    });
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await setUserFromSession(session);
    }
  };

  const updateAvatar = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatar: avatarUrl });
    }
  };

  const updateDisplayName = (name: string) => {
    if (user) {
      setUser({ ...user, displayName: name });
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('user-not-found-or-wrong-password');
      }
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('email-already-in-use');
      }
      throw error;
    }

    // Создаём профиль пользователя в таблице users
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        display_name: displayName,
        avatar: '',
        banner: '',
        subscriber_count: 0,
      });
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateAvatar,
    updateDisplayName,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
