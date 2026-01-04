import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Возвращаем mock клиент для билда
    if (typeof window === 'undefined') {
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    throw new Error('Supabase credentials not found');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

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
