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

    // Функция для установки пользователя из сессии
    const handleSession = async (session: Session | null) => {
      if (!mounted) return;
      
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('display_name, avatar')
            .eq('id', session.user.id)
            .single();

          if (mounted) {
            setUser({
              uid: session.user.id,
              email: session.user.email || null,
              displayName: profile?.display_name || session.user.user_metadata?.display_name || null,
              avatar: profile?.avatar || null,
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          if (mounted) {
            setUser({
              uid: session.user.id,
              email: session.user.email || null,
              displayName: session.user.user_metadata?.display_name || null,
              avatar: null,
            });
          }
        }
      } else {
        if (mounted) {
          setUser(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Подписываемся на изменения авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        await handleSession(session);
      }
    );

    // Проверяем текущую сессию при загрузке
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', session?.user?.email, error);
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('display_name, avatar')
        .eq('id', session.user.id)
        .single();

      setUser({
        uid: session.user.id,
        email: session.user.email || null,
        displayName: profile?.display_name || session.user.user_metadata?.display_name || null,
        avatar: profile?.avatar || null,
      });
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
