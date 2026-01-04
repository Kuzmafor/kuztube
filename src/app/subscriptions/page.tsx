'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatViews } from '@/lib/utils';

interface Subscription {
  channelId: string;
  channelName: string;
  channelAvatar?: string;
  subscribers?: number;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  uploadedAt?: string;
}

// Демо подписки
const demoSubscriptions: Subscription[] = [
  { channelId: 'rick-astley', channelName: 'Rick Astley', subscribers: 14200000 },
  { channelId: 'psy', channelName: 'officialpsy', subscribers: 19800000 },
  { channelId: 'luis-fonsi', channelName: 'Luis Fonsi', subscribers: 32500000 },
  { channelId: 'ed-sheeran', channelName: 'Ed Sheeran', subscribers: 54300000 },
  { channelId: 'queen', channelName: 'Queen Official', subscribers: 22100000 },
  { channelId: 'adele', channelName: 'Adele', subscribers: 28900000 },
];

const demoVideos: Video[] = [
  {
    id: 'yt_dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    authorId: 'rick-astley',
    authorName: 'Rick Astley',
    views: 1500000000,
    uploadedAt: '2 дня назад'
  },
  {
    id: 'yt_9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg',
    authorId: 'psy',
    authorName: 'officialpsy',
    views: 4800000000,
    uploadedAt: '1 неделю назад'
  },
  {
    id: 'yt_kJQP7kiw5Fk',
    title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
    thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
    authorId: 'luis-fonsi',
    authorName: 'Luis Fonsi',
    views: 8200000000,
    uploadedAt: '3 дня назад'
  },
  {
    id: 'yt_JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You',
    thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    authorId: 'ed-sheeran',
    authorName: 'Ed Sheeran',
    views: 6100000000,
    uploadedAt: '5 дней назад'
  },
  {
    id: 'yt_fJ9rUzIMcZQ',
    title: 'Queen - Bohemian Rhapsody',
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    authorId: 'queen',
    authorName: 'Queen Official',
    views: 1700000000,
    uploadedAt: '1 день назад'
  },
  {
    id: 'yt_YQHsXMglC9A',
    title: 'Adele - Hello',
    thumbnail: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg',
    authorId: 'adele',
    authorName: 'Adele',
    views: 3100000000,
    uploadedAt: '4 дня назад'
  },
];

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const saved = localStorage.getItem('kuztube-subscriptions');
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    } else {
      setSubscriptions(demoSubscriptions);
    }
    setVideos(demoVideos);
  }, []);

  const filteredVideos = selectedChannel 
    ? videos.filter(v => v.authorId === selectedChannel)
    : videos;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div 
          className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.1))' }}
        >
          <span className="text-6xl">📺</span>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Подписки
        </h1>
        <p className="mb-6 text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Войдите, чтобы видеть видео от каналов, на которые вы подписаны
        </p>
        <Link
          href="/login"
          className="px-8 py-3 rounded-full font-medium transition-all hover:scale-105"
          style={{ 
            background: 'linear-gradient(135deg, #ff0000, #cc0000)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(255,0,0,0.4)'
          }}
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
          >
            <span className="text-2xl">📺</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Подписки
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {subscriptions.length} каналов
            </p>
          </div>
        </div>
        
        {/* Переключатель вида */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            style={{ color: 'var(--text-primary)' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10' : 'hover:bg-white/5'}`}
            style={{ color: 'var(--text-primary)' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Список каналов - горизонтальный скролл */}
      <div 
        className="mb-8 p-4 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
      >
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedChannel(null)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all flex-shrink-0 min-w-[90px] ${
              !selectedChannel ? 'scale-105' : 'hover:bg-white/5'
            }`}
            style={!selectedChannel ? {
              background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.1))',
              border: '1px solid rgba(255,0,0,0.3)'
            } : {}}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ 
                background: !selectedChannel 
                  ? 'linear-gradient(135deg, #ff0000, #cc0000)' 
                  : 'rgba(255,255,255,0.1)'
              }}
            >
              🎬
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Все</span>
          </button>
          
          {subscriptions.map(sub => (
            <button
              key={sub.channelId}
              onClick={() => setSelectedChannel(sub.channelId)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all flex-shrink-0 min-w-[90px] ${
                selectedChannel === sub.channelId ? 'scale-105' : 'hover:bg-white/5'
              }`}
              style={selectedChannel === sub.channelId ? {
                background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.1))',
                border: '1px solid rgba(255,0,0,0.3)'
              } : {}}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white relative"
                style={{ 
                  background: selectedChannel === sub.channelId 
                    ? 'linear-gradient(135deg, #ff0000, #cc0000)' 
                    : 'linear-gradient(135deg, #ff0000aa, #cc0000aa)'
                }}
              >
                {sub.channelName.charAt(0)}
                {/* Онлайн индикатор */}
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full"
                  style={{ 
                    background: '#22c55e',
                    border: '2px solid var(--background)',
                    boxShadow: '0 0 8px rgba(34,197,94,0.6)'
                  }}
                />
              </div>
              <span className="text-xs font-medium max-w-[80px] truncate" style={{ color: 'var(--text-primary)' }}>
                {sub.channelName}
              </span>
              {sub.subscribers && (
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {formatViews(sub.subscribers)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Секция с видео */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}
        >
          <span>🔥</span>
        </div>
        <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {selectedChannel 
            ? `Видео от ${subscriptions.find(s => s.channelId === selectedChannel)?.channelName}`
            : 'Последние видео'
          }
        </h2>
        <span 
          className="text-sm px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
        >
          {filteredVideos.length}
        </span>
      </div>

      {/* Видео */}
      {filteredVideos.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
        >
          <span className="text-5xl mb-4 block">📭</span>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Нет видео
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Этот канал пока не загрузил видео
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredVideos.map(video => (
            <div 
              key={video.id} 
              className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
            >
              <Link href={`/watch/${video.id}`}>
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                  />
                  {/* Время видео */}
                  <div 
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'rgba(0,0,0,0.8)', color: 'white' }}
                  >
                    3:32
                  </div>
                </div>
              </Link>
              <div className="p-3">
                <div className="flex gap-3">
                  <Link href={`/channel/${video.authorId}`}>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-transform hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                    >
                      {video.authorName.charAt(0)}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/watch/${video.id}`}>
                      <h3 
                        className="font-medium line-clamp-2 text-sm group-hover:text-white transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {video.title}
                      </h3>
                    </Link>
                    <Link href={`/channel/${video.authorId}`} className="hover:underline">
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {video.authorName}
                      </p>
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatViews(video.views)} • {video.uploadedAt || 'Недавно'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Режим списка */
        <div className="space-y-3">
          {filteredVideos.map(video => (
            <div 
              key={video.id} 
              className="flex gap-4 p-3 rounded-xl transition-all hover:bg-white/5"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
            >
              <Link href={`/watch/${video.id}`} className="flex-shrink-0">
                <div className="w-40 md:w-60 aspect-video rounded-xl overflow-hidden relative">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                  <div 
                    className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: 'rgba(0,0,0,0.8)', color: 'white' }}
                  >
                    3:32
                  </div>
                </div>
              </Link>
              <div className="flex-1 min-w-0 py-1">
                <Link href={`/watch/${video.id}`}>
                  <h3 
                    className="font-medium text-base mb-1 line-clamp-2 hover:text-white transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {video.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/channel/${video.authorId}`} className="flex items-center gap-2 hover:underline">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                    >
                      {video.authorName.charAt(0)}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {video.authorName}
                    </span>
                  </Link>
                  <span style={{ color: 'var(--text-secondary)' }}>•</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatViews(video.views)} просмотров
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {video.uploadedAt || 'Недавно'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
