'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useGamification, ACHIEVEMENTS, LEVELS, SHOP_ITEMS } from '@/lib/useGamification';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarWithFrame from '@/components/AvatarWithFrame';

export default function ProfilePage() {
  const { user, updateAvatar } = useAuth();
  const router = useRouter();
  const { stats, getCurrentLevel, getNextLevel, getLevelProgress } = useGamification();
  const [isPremium, setIsPremium] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsPremium(localStorage.getItem('kuztube-premium') === 'true');
    setAvatarUrl(user.avatar);
  }, [user, router]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Проверка размера (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 2MB');
      return;
    }

    setUploading(true);

    try {
      // Конвертируем в base64 для простоты (можно использовать Supabase Storage)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Сохраняем в базу данных
        const { error } = await supabase
          .from('users')
          .update({ avatar: base64 })
          .eq('id', user.uid);

        if (error) {
          console.error('Error updating avatar:', error);
          alert('Ошибка при обновлении аватарки');
        } else {
          setAvatarUrl(base64);
          updateAvatar(base64);
          alert('Аватарка обновлена!');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      setUploading(false);
    }
  };

  if (!user) return null;

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = getLevelProgress();

  // Группировка достижений по категориям
  const achievementsByCategory = {
    views: ACHIEVEMENTS.filter(a => a.category === 'views'),
    comments: ACHIEVEMENTS.filter(a => a.category === 'comments'),
    likes: ACHIEVEMENTS.filter(a => a.category === 'likes'),
    subs: ACHIEVEMENTS.filter(a => a.category === 'subs'),
    special: ACHIEVEMENTS.filter(a => a.category === 'special'),
  };

  const categoryNames: Record<string, string> = {
    views: '👀 Просмотры',
    comments: '💬 Комментарии',
    likes: '❤️ Лайки',
    subs: '🔔 Подписки',
    special: '⭐ Особые',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Профиль */}
      <div 
        className="rounded-3xl p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,35,0.95), rgba(20,20,25,0.95))',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="flex items-center gap-6 mb-8">
          {/* Аватар с уровнем и рамкой */}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div className="relative group">
              <AvatarWithFrame
                name={user.displayName || 'U'}
                avatarUrl={avatarUrl}
                equippedFrame={stats.equippedItems?.frame}
                equippedBadge={stats.equippedItems?.badge}
                size="xl"
                isPremium={isPremium}
                showBadge={true}
                onClick={handleAvatarClick}
                className="cursor-pointer"
              />
              {/* Overlay при наведении */}
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                onClick={handleAvatarClick}
              >
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
            {/* Бейдж уровня */}
            <div 
              className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-sm font-bold z-30"
              style={{ 
                background: currentLevel.color,
                color: 'white',
                boxShadow: `0 0 10px ${currentLevel.color}`
              }}
            >
              Ур. {currentLevel.level}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">
              {user.displayName || 'Пользователь'}
            </h1>
            <p className="text-lg mb-3" style={{ color: currentLevel.color }}>
              {currentLevel.name}
            </p>
            
            {/* Прогресс-бар */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>{stats.xp} XP</span>
                {nextLevel && <span>{nextLevel.minXP} XP</span>}
              </div>
              <div 
                className="h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || currentLevel.color})`
                  }}
                />
              </div>
              {nextLevel && (
                <p className="text-xs text-gray-500 mt-1">
                  До уровня "{nextLevel.name}": {nextLevel.minXP - stats.xp} XP
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <p className="text-3xl font-bold text-white">{stats.videosWatched}</p>
            <p className="text-sm text-gray-400">Просмотров</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <p className="text-3xl font-bold text-white">{stats.commentsPosted}</p>
            <p className="text-sm text-gray-400">Комментариев</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <p className="text-3xl font-bold text-white">{stats.likesGiven}</p>
            <p className="text-sm text-gray-400">Лайков</p>
          </div>
          <div 
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <p className="text-3xl font-bold text-white">{stats.achievements.length}</p>
            <p className="text-sm text-gray-400">Достижений</p>
          </div>
        </div>
      </div>

      {/* Уровни */}
      <div 
        className="rounded-3xl p-6 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,35,0.95), rgba(20,20,25,0.95))',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <h2 className="text-xl font-bold text-white mb-4">📊 Уровни</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {LEVELS.map((level) => {
            const isUnlocked = stats.xp >= level.minXP;
            const isCurrent = currentLevel.level === level.level;
            return (
              <div 
                key={level.level}
                className={`p-3 rounded-xl text-center transition-all ${isCurrent ? 'scale-110' : ''}`}
                style={{ 
                  background: isUnlocked 
                    ? `linear-gradient(135deg, ${level.color}33, ${level.color}11)` 
                    : 'rgba(255,255,255,0.03)',
                  border: isCurrent ? `2px solid ${level.color}` : '1px solid rgba(255,255,255,0.05)',
                  opacity: isUnlocked ? 1 : 0.5
                }}
              >
                <p 
                  className="text-2xl font-bold"
                  style={{ color: isUnlocked ? level.color : '#666' }}
                >
                  {level.level}
                </p>
                <p className="text-xs text-gray-400 truncate">{level.name}</p>
                <p className="text-xs text-gray-500">{level.minXP} XP</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Достижения */}
      <div 
        className="rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(30,30,35,0.95), rgba(20,20,25,0.95))',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <h2 className="text-xl font-bold text-white mb-4">
          🏆 Достижения ({stats.achievements.length}/{ACHIEVEMENTS.length})
        </h2>
        
        {Object.entries(achievementsByCategory).map(([category, achievements]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              {categoryNames[category]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((ach) => {
                const isUnlocked = stats.achievements.includes(ach.id);
                return (
                  <div 
                    key={ach.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isUnlocked ? 'hover:scale-[1.02]' : ''
                    }`}
                    style={{ 
                      background: isUnlocked 
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))' 
                        : 'rgba(255,255,255,0.03)',
                      border: isUnlocked 
                        ? '1px solid rgba(34,197,94,0.3)' 
                        : '1px solid rgba(255,255,255,0.05)',
                      opacity: isUnlocked ? 1 : 0.5
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ 
                        background: isUnlocked 
                          ? 'rgba(34,197,94,0.3)' 
                          : 'rgba(255,255,255,0.05)',
                        filter: isUnlocked ? 'none' : 'grayscale(100%)'
                      }}
                    >
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                        {ach.name}
                      </p>
                      <p className="text-sm text-gray-400">{ach.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isUnlocked ? 'text-green-400' : 'text-gray-500'}`}>
                        +{ach.xp} XP
                      </p>
                      {isUnlocked && (
                        <p className="text-xs text-green-500">✓ Получено</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
