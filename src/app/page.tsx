'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  createdAt: string;
}

// Категории
const categories = [
  { icon: '🔥', label: 'Популярное', query: 'Популярное' },
  { icon: '🎵', label: 'Музыка', query: 'Музыка' },
  { icon: '🎮', label: 'Игры', query: 'Игры' },
  { icon: '📚', label: 'Обучение', query: 'Обучение' },
  { icon: '💻', label: 'Технологии', query: 'Технологии' },
  { icon: '🎬', label: 'Фильмы', query: 'Фильмы' },
  { icon: '⚽', label: 'Спорт', query: 'Спорт' },
  { icon: '🍳', label: 'Кулинария', query: 'Кулинария' },
];

function HomeContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  // Проверяем, скрыт ли баннер
  useEffect(() => {
    const hidden = localStorage.getItem('kuztube-banner-hidden');
    if (hidden === 'true') {
      setShowBanner(false);
    }
  }, []);

  const hideBanner = () => {
    setShowBanner(false);
    localStorage.setItem('kuztube-banner-hidden', 'true');
  };

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const videosData = data.map(v => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            authorId: v.author_id,
            authorName: v.author_name,
            views: v.views,
            createdAt: v.created_at,
          }));
          setVideos(videosData);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = videos.filter(video => 
        video.title.toLowerCase().includes(query) ||
        video.authorName.toLowerCase().includes(query)
      );
      setFilteredVideos(filtered);
      setActiveCategory(searchQuery);
    } else {
      setFilteredVideos(videos);
      setActiveCategory(null);
    }
  }, [searchQuery, videos]);

  return (
    <div className="min-h-screen">
      {/* Hero баннер */}
      {showBanner && !searchQuery && (
        <div 
          className="relative mx-4 mt-4 rounded-3xl overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={hideBanner}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}
            title="Скрыть баннер"
          >
            <svg className="w-5 h-5 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-red-500 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-purple-500 blur-3xl" />
          </div>
          
          <div className="relative px-8 py-10 flex items-center justify-between">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold text-white mb-3">
                Добро пожаловать в <span className="text-white">Kuz</span><span className="text-red-500">Tube</span>
              </h1>
              <p className="text-gray-300 text-lg mb-6">
                Смотрите лучшие видео, подписывайтесь на каналы и делитесь контентом
              </p>
              <div className="flex gap-3">
                <Link 
                  href="/shorts"
                  className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(255,0,0,0.4)'
                  }}
                >
                  ⚡ Смотреть Shorts
                </Link>
                <Link 
                  href="/premium"
                  className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                    color: 'black',
                    boxShadow: '0 4px 15px rgba(255,215,0,0.4)'
                  }}
                >
                  👑 Premium
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Категории */}
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.query}
              href={activeCategory === cat.query ? '/' : `/?search=${cat.query}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all hover:scale-105 ${
                activeCategory === cat.query 
                  ? 'text-white' 
                  : 'hover:bg-white/10'
              }`}
              style={activeCategory === cat.query ? {
                background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                boxShadow: '0 4px 15px rgba(255,0,0,0.3)'
              } : {
                backgroundColor: 'var(--background-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        {/* Результаты поиска */}
        {searchQuery && filteredVideos.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}
            >
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Ничего не найдено
            </h2>
            <p className="text-gray-400 mb-6">
              По запросу "{searchQuery}" видео не найдено
            </p>
            <Link 
              href="/"
              className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                color: 'white'
              }}
            >
              На главную
            </Link>
          </div>
        )}
        
        {/* Заголовок секции */}
        {!searchQuery && !loading && (
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
            >
              <span className="text-xl">🎬</span>
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Рекомендации
              </h2>
              <p className="text-sm text-gray-400">Популярные видео для вас</p>
            </div>
          </div>
        )}

        {searchQuery && filteredVideos.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' }}
            >
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Результаты поиска
              </h2>
              <p className="text-sm text-gray-400">"{searchQuery}" — найдено {filteredVideos.length} видео</p>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div 
                  className="aspect-video rounded-xl mb-3"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                />
                <div className="flex gap-3">
                  <div 
                    className="w-9 h-9 rounded-full"
                    style={{ backgroundColor: 'var(--background-secondary)' }}
                  />
                  <div className="flex-1">
                    <div 
                      className="h-4 rounded mb-2"
                      style={{ backgroundColor: 'var(--background-secondary)' }}
                    />
                    <div 
                      className="h-3 rounded w-2/3"
                      style={{ backgroundColor: 'var(--background-secondary)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredVideos.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div 
              className="w-32 h-32 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.2), rgba(255,0,0,0.1))' }}
            >
              <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Пока нет видео
            </h2>
            <p className="text-gray-400 mb-6">
              Будьте первым, кто загрузит видео!
            </p>
            <Link 
              href="/upload"
              className="px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                color: 'white'
              }}
            >
              Загрузить видео
            </Link>
          </div>
        ) : filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {filteredVideos.map(video => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnail={video.thumbnail}
                authorId={video.authorId}
                authorName={video.authorName}
                views={video.views}
                createdAt={video.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading fallback
function HomeLoading() {
  return (
    <div className="min-h-screen px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div 
              className="aspect-video rounded-xl mb-3"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            />
            <div className="flex gap-3">
              <div 
                className="w-9 h-9 rounded-full"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              />
              <div className="flex-1">
                <div 
                  className="h-4 rounded mb-2"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                />
                <div 
                  className="h-3 rounded w-2/3"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
