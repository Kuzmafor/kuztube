'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatViews } from '@/lib/utils';

interface HistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  watchedAt: number;
  progress?: number; // Прогресс просмотра 0-100
}

// Группировка по датам
function groupByDate(items: HistoryItem[]): { [key: string]: HistoryItem[] } {
  const groups: { [key: string]: HistoryItem[] } = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  items.forEach(item => {
    const date = new Date(item.watchedAt);
    date.setHours(0, 0, 0, 0);
    
    let key: string;
    if (date.getTime() === today.getTime()) {
      key = 'Сегодня';
    } else if (date.getTime() === yesterday.getTime()) {
      key = 'Вчера';
    } else if (date > weekAgo) {
      key = 'На этой неделе';
    } else {
      key = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return groups;
}

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('kuztube-history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      parsed.sort((a: HistoryItem, b: HistoryItem) => b.watchedAt - a.watchedAt);
      // Добавляем случайный прогресс для демо
      const withProgress = parsed.map((item: HistoryItem) => ({
        ...item,
        progress: item.progress || Math.floor(Math.random() * 100)
      }));
      setHistory(withProgress);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('kuztube-history');
    setHistory([]);
    setShowClearConfirm(false);
  };

  const removeFromHistory = (videoId: string) => {
    const newHistory = history.filter(item => item.id !== videoId);
    localStorage.setItem('kuztube-history', JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const filteredHistory = searchQuery
    ? history.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  const groupedHistory = groupByDate(filteredHistory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
        >
          <span className="text-2xl">📜</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)', boxShadow: '0 4px 20px rgba(255,0,0,0.3)' }}
          >
            <span className="text-2xl">📜</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              История просмотров
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {history.length} видео
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Поиск */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск в истории..."
              className="pl-10 pr-4 py-2 rounded-xl outline-none w-64"
              style={{ 
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)'
              }}
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:bg-red-500/20 flex items-center gap-2"
              style={{ color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Очистить</span>
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно подтверждения */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div 
            className="p-6 rounded-2xl max-w-sm w-full mx-4"
            style={{ 
              background: 'linear-gradient(135deg, rgba(30,30,35,0.98), rgba(20,20,25,0.98))',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="text-center mb-4">
              <span className="text-5xl">🗑️</span>
            </div>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
              Очистить историю?
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
              Это действие нельзя отменить. Вся история просмотров будет удалена.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl transition-colors hover:bg-white/10"
                style={{ color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Отмена
              </button>
              <button
                onClick={clearHistory}
                className="flex-1 py-2 rounded-xl transition-colors"
                style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)', color: 'white' }}
              >
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {history.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
        >
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.1))' }}
          >
            <span className="text-5xl">📜</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            История пуста
          </h2>
          <p className="mb-6 text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Видео, которые вы смотрите, появятся здесь
          </p>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #ff0000, #cc0000)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(255,0,0,0.4)'
            }}
          >
            Смотреть видео
          </Link>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
        >
          <span className="text-5xl mb-4">🔍</span>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Ничего не найдено
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            По запросу "{searchQuery}" ничего не найдено
          </p>
        </div>
      ) : (
        /* Группированная история */
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <span>📅</span>
                </div>
                <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                  {date}
                </h2>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
                >
                  {items.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {items.map((video) => (
                  <div 
                    key={video.id} 
                    className="flex gap-4 p-3 rounded-xl transition-all hover:bg-white/5 group"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}
                  >
                    {/* Превью */}
                    <Link href={`/watch/${video.id}`} className="flex-shrink-0 relative">
                      <div className="w-44 md:w-56 aspect-video rounded-xl overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      {/* Прогресс просмотра */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <div 
                          className="h-full"
                          style={{ 
                            width: `${video.progress || 0}%`,
                            background: 'linear-gradient(90deg, #ff0000, #cc0000)'
                          }}
                        />
                      </div>
                      {/* Время */}
                      <div 
                        className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{ background: 'rgba(0,0,0,0.8)', color: 'white' }}
                      >
                        3:32
                      </div>
                    </Link>
                    
                    {/* Информация */}
                    <div className="flex-1 min-w-0 py-1">
                      <Link href={`/watch/${video.id}`}>
                        <h3 
                          className="font-medium line-clamp-2 mb-2 hover:text-white transition-colors"
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
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatViews(video.views)} просмотров
                      </p>
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>🕐</span>
                        {new Date(video.watchedAt).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {/* Кнопка удаления */}
                    <button
                      onClick={() => removeFromHistory(video.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-2 h-fit rounded-full hover:bg-red-500/20"
                      style={{ color: '#ff6b6b' }}
                      title="Удалить из истории"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
