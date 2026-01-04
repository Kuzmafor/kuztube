-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  description TEXT DEFAULT '',
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица видео
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для videos
CREATE POLICY "Anyone can view videos" ON videos
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = author_id);

-- Разрешаем анонимное обновление счётчика просмотров
CREATE POLICY "Anyone can update video views" ON videos
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Создаём Storage bucket для видео
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для Storage
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscriber_id, channel_id)
);

-- Включаем RLS для подписок
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Политики для subscriptions
CREATE POLICY "Anyone can view subscriptions" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Users can subscribe" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can unsubscribe" ON subscriptions
  FOR DELETE USING (auth.uid() = subscriber_id);

-- Добавляем колонку description если её нет
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Добавляем колонку is_short для Shorts видео
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
