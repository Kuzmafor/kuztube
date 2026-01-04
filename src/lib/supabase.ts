import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // На сервере во время билда возвращаем placeholder
  if (typeof window === 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // На клиенте используем singleton с реальными credentials
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not found');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'kuztube-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  
  return supabaseInstance;
}

// Используем getter для ленивой инициализации на клиенте
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient();
    const value = (client as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

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
