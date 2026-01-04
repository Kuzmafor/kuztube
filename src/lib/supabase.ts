import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const isBrowser = typeof window !== 'undefined';
  
  supabaseInstance = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: true,
        detectSessionInUrl: isBrowser,
        storage: isBrowser ? {
          getItem: (key) => {
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              window.localStorage.setItem(key, value);
            } catch {
              // ignore
            }
          },
          removeItem: (key) => {
            try {
              window.localStorage.removeItem(key);
            } catch {
              // ignore
            }
          },
        } : undefined,
        storageKey: 'sb-kuztube-auth-token',
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    }
  );

  return supabaseInstance;
}

// Экспортируем как getter для ленивой инициализации
export const supabase = getSupabaseClient();

// Типы для базы данных
export interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  author_id: string;
  author_name: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar: string;
  banner: string;
  subscriber_count: number;
  created_at: string;
}
