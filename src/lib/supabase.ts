import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Очищаем старые ключи авторизации при загрузке
if (typeof window !== 'undefined') {
  // Удаляем старый кастомный ключ, который конфликтует
  const oldKey = 'sb-kuztube-auth-token';
  if (localStorage.getItem(oldKey)) {
    localStorage.removeItem(oldKey);
  }
}

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  supabaseInstance = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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
