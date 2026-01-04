'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Short {
  id: string;
  title: string;
  video_url: string;
  thumbnail: string;
  author_name: string;
  author_id: string;
  views: number;
  likes: number;
  dislikes: number;
}

// Демо Shorts (показываются если нет реальных)
const demoShorts: Short[] = [
  {
    id: 'demo1',
    title: 'Невероятный трюк! 🔥',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: '',
    author_name: 'TrickMaster',
    author_id: '',
    views: 1500000,
    likes: 85000,
    dislikes: 0,
  },
  {
    id: 'demo2',
    title: 'Первое видео на YouTube',
    video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
    thumbnail: '',
    author_name: 'jawed',
    author_id: '',
    views: 250000000,
    likes: 12000000,
    dislikes: 0,
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' млрд';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + ' млн';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' тыс';
  return num.toString();
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [disliked, setDisliked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_short', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setShorts(data);
      } else {
        // Показываем демо если нет реальных Shorts
        setShorts(demoShorts);
      }
    } catch (err) {
      console.error('Error loading shorts:', err);
      setShorts(demoShorts);
    } finally {
      setLoading(false);
    }
  };

  const currentShort = shorts[currentIndex];

  const goToNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleLike = (id: string) => {
    const newLiked = new Set(liked);
    const newDisliked = new Set(disliked);
    
    if (newLiked.has(id)) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
      newDisliked.delete(id);
    }
    
    setLiked(newLiked);
    setDisliked(newDisliked);
  };

  const toggleDislike = (id: string) => {
    const newLiked = new Set(liked);
    const newDisliked = new Set(disliked);
    
    if (newDisliked.has(id)) {
      newDisliked.delete(id);
    } else {
      newDisliked.add(id);
      newLiked.delete(id);
    }
    
    setLiked(newLiked);
    setDisliked(newDisliked);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!currentShort) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4">
        <span className="text-6xl">📱</span>
        <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          Shorts пока нет
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Загрузите первый Short!
        </p>
      </div>
    );
  }

  const isYouTubeEmbed = currentShort.video_url.includes('youtube.com/embed');

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] py-4">
      <div className="relative flex items-center gap-4">
        {/* Кнопка назад */}
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`p-4 rounded-full transition-colors ${
            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Short контейнер */}
        <div 
          className="relative rounded-2xl overflow-hidden"
          style={{ 
            width: '580px', 
            height: '95vh',
            maxHeight: '1030px',
            backgroundColor: 'var(--background-secondary)'
          }}
        >
          {/* Видео */}
          {isYouTubeEmbed ? (
            <iframe
              src={`${currentShort.video_url}?autoplay=1&loop=1&controls=0&modestbranding=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              src={currentShort.video_url}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              controls={false}
            />
          )}

          {/* Overlay с информацией */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="text-white font-semibold text-2xl mb-2">
              {currentShort.title}
            </h3>
            <p className="text-gray-300 text-lg">
              @{currentShort.author_name}
            </p>
          </div>

          {/* Боковые кнопки */}
          <div className="absolute right-5 bottom-32 flex flex-col items-center gap-6">
            {/* Лайк */}
            <button
              onClick={() => toggleLike(currentShort.id)}
              className="flex flex-col items-center"
            >
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  liked.has(currentShort.id) ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <span className="text-4xl">👍</span>
              </div>
              <span className="text-white text-base mt-1">
                {formatNumber(currentShort.likes + (liked.has(currentShort.id) ? 1 : 0))}
              </span>
            </button>

            {/* Дизлайк */}
            <button
              onClick={() => toggleDislike(currentShort.id)}
              className="flex flex-col items-center"
            >
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  disliked.has(currentShort.id) ? 'bg-gray-600' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <span className="text-4xl">👎</span>
              </div>
              <span className="text-white text-base mt-1">Дизлайк</span>
            </button>

            {/* Комментарии */}
            <button className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <span className="text-4xl">💬</span>
              </div>
              <span className="text-white text-base mt-1">Комм.</span>
            </button>

            {/* Поделиться */}
            <button className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                <span className="text-4xl">📤</span>
              </div>
              <span className="text-white text-base mt-1">Поделиться</span>
            </button>
          </div>

          {/* Счётчик */}
          <div className="absolute top-5 right-5 px-4 py-2 rounded-full bg-black/50 text-white text-base font-medium">
            {currentIndex + 1} / {shorts.length}
          </div>

          {/* Просмотры */}
          <div className="absolute top-5 left-5 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
            👁 {formatNumber(currentShort.views)}
          </div>
        </div>

        {/* Кнопка вперёд */}
        <button
          onClick={goToNext}
          disabled={currentIndex === shorts.length - 1}
          className={`p-4 rounded-full transition-colors ${
            currentIndex === shorts.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
