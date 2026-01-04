'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatViews } from '@/lib/utils';

interface SavedVideo {
  id: string;
  title: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  savedAt: number;
}

export default function WatchLaterPage() {
  const { user } = useAuth();
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('kuztube-watch-later') || '[]');
    setSavedVideos(saved);
  }, []);

  const removeFromWatchLater = (videoId: string) => {
    const updated = savedVideos.filter(v => v.id !== videoId);
    setSavedVideos(updated);
    localStorage.setItem('kuztube-watch-later', JSON.stringify(updated));
  };

  const clearAll = () => {
    setSavedVideos([]);
    localStorage.setItem('kuztube-watch-later', JSON.stringify([]));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <span className="text-6xl mb-4">🕐</span>
        <h1 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Смотреть позже
        </h1>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          Войдите, чтобы сохранять видео
        </p>
        <Link
          href="/login"
          className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🕐</span>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Смотреть позже
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {savedVideos.length} видео
            </p>
          </div>
        </div>
        {savedVideos.length > 0 && (
          <button
            onClick={clearAll}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            Очистить всё
          </button>
        )}
      </div>

      {savedVideos.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)' }}>
            Нет сохранённых видео
          </p>
          <Link href="/" className="text-red-500 hover:underline mt-2 inline-block">
            Перейти на главную
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedVideos.map((video, index) => (
            <div 
              key={video.id} 
              className="flex gap-4 p-3 rounded-xl transition-colors hover:bg-white/5"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <span className="text-sm w-6 flex-shrink-0 pt-2" style={{ color: 'var(--text-secondary)' }}>
                {index + 1}
              </span>
              <Link href={`/watch/${video.id}`} className="w-40 flex-shrink-0">
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/watch/${video.id}`}>
                  <h3 
                    className="font-medium line-clamp-2 hover:text-white transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {video.title}
                  </h3>
                </Link>
                <Link href={`/channel/${video.authorId}`}>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {video.authorName}
                  </p>
                </Link>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatViews(video.views)} просмотров
                </p>
              </div>
              <button
                onClick={() => removeFromWatchLater(video.id)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors self-center"
                title="Удалить"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
