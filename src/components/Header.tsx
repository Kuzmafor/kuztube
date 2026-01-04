'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { useGamification, ACHIEVEMENTS } from '@/lib/useGamification';
import AvatarWithFrame from './AvatarWithFrame';

// Рекомендуемые запросы
const suggestedSearches = [
  { icon: '🔥', text: 'Популярное' },
  { icon: '🎮', text: 'Игры' },
  { icon: '🎵', text: 'Музыка' },
  { icon: '📚', text: 'Обучение' },
  { icon: '💻', text: 'Программирование' },
  { icon: '⚛️', text: 'React' },
  { icon: '🔷', text: 'TypeScript' },
  { icon: '⚡', text: 'Supabase' },
  { icon: '▲', text: 'Next.js' },
  { icon: '🎨', text: 'Tailwind CSS' },
];

// Бегущая строка с новостями
const tickerNews = [
  '🔥 Новый тренд: React 19 уже здесь!',
  '🎮 Топ игровых стримов недели',
  '🎵 Музыкальные хиты 2026',
  '💡 Советы по программированию от экспертов',
  '🚀 KuzTube обновился! Новые функции',
  '⭐ Присоединяйтесь к Premium для эксклюзивного контента',
  '🎬 Смотрите новые видео каждый день',
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { stats } = useGamification();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, text: string, time: string, read: boolean, icon: string, type: string}>>([]);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const defaultNotifications = [
    { id: 'n1', text: 'Rick Astley загрузил новое видео', time: '2 часа назад', read: false, icon: '🔔', type: 'video' },
    { id: 'n2', text: 'PSY выпустил новый клип', time: '5 часов назад', read: false, icon: '🔔', type: 'video' },
    { id: 'n3', text: 'Ваше видео набрало 1000 просмотров!', time: '1 день назад', read: true, icon: '🎉', type: 'milestone' },
  ];

  // Загрузка уведомлений из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kuztube-notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(defaultNotifications);
    }
  }, []);

  // Добавление достижений в уведомления
  useEffect(() => {
    if (stats.achievements.length > 0) {
      const achievementNotifs = stats.achievements.map(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (!ach) return null;
        return {
          id: `ach_${achId}`,
          text: `🏆 Достижение "${ach.name}" получено! +${ach.xp} XP`,
          time: 'Недавно',
          read: true,
          icon: ach.icon,
          type: 'achievement'
        };
      }).filter(Boolean) as typeof notifications;

      setNotifications(prev => {
        // Добавляем только новые достижения
        const existingIds = prev.map(n => n.id);
        const newAchievements = achievementNotifs.filter(a => !existingIds.includes(a.id));
        if (newAchievements.length > 0) {
          const updated = [...newAchievements.map(a => ({ ...a, read: false })), ...prev];
          localStorage.setItem('kuztube-notifications', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [stats.achievements]);

  // Сохранение уведомлений в localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('kuztube-notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  // Проверка Premium статуса
  useEffect(() => {
    const checkPremium = () => {
      const premiumStatus = localStorage.getItem('kuztube-premium');
      setIsPremium(premiumStatus === 'true');
    };
    checkPremium();
    window.addEventListener('storage', checkPremium);
    return () => window.removeEventListener('storage', checkPremium);
  }, []);

  // Бегущая строка - смена новостей
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % tickerNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    router.push(`/?search=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  // Фильтрация подсказок по введённому тексту
  const filteredSuggestions = searchQuery.trim()
    ? suggestedSearches.filter(s => 
        s.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suggestedSearches;

  return (
    <header 
      className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4"
      style={{ backgroundColor: 'var(--background-secondary)' }}
    >
      {/* Menu Button & Logo & Ticker */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Кнопка меню */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-tight">
              <span className="text-white">Kuz</span><span style={{ color: '#ff0000' }}>Tube</span>
            </span>
            <span className="text-[10px] leading-none animate-blink-text hidden sm:block">Эксклюзивный тест</span>
          </div>
        </Link>

        {/* Бегущая строка справа от логотипа */}
        <div className="hidden md:flex items-center ml-4 px-3 py-1 rounded-full overflow-hidden max-w-[280px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,0,0,0.2)' }}>
          <span className="text-red-500 text-[10px] font-bold mr-2 animate-pulse flex-shrink-0">●</span>
          <div className="overflow-hidden">
            <span className="text-xs text-gray-300 whitespace-nowrap animate-fade-in block truncate">
              {tickerNews[currentTickerIndex]}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="flex-1 max-w-xl mx-4 relative">
        <form onSubmit={handleSearch}>
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Поиск видео..."
              className="flex-1 px-4 py-2 rounded-l-full outline-none"
              style={{ 
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-r-full transition-colors hover:bg-white/10"
              style={{ 
                backgroundColor: 'var(--background-hover)',
                border: '1px solid var(--border-color)',
                borderLeft: 'none'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
        
        {/* Выпадающий список с подсказками */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg py-2 max-h-80 overflow-y-auto"
            style={{ 
              backgroundColor: 'var(--background-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide">
              {searchQuery.trim() ? 'Результаты' : 'Рекомендуемые запросы'}
            </div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {user && (
          <>
            <Link 
              href="/upload" 
              className="px-3 py-1.5 rounded-full hidden md:flex items-center gap-1.5 transition-colors"
              style={{ 
                background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(255,0,0,0.3)'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Загрузить</span>
            </Link>

            {/* Уведомления */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                      color: 'white'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--background-secondary)', 
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Уведомления</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                        Нет уведомлений
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-white/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                              style={{ 
                                backgroundColor: notif.type === 'achievement' 
                                  ? 'rgba(34,197,94,0.2)' 
                                  : 'var(--kuztube-red)'
                              }}
                            >
                              {notif.icon || '🔔'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                {notif.text}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {notif.time}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* User Menu */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse" />
        ) : user ? (
          <div className="relative">
            {/* Онлайн индикатор */}
            {isOnline && (
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full z-20"
                style={{ 
                  background: '#22c55e',
                  border: '2px solid var(--background-secondary)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.8)'
                }}
                title="В сети"
              />
            )}
            
            <AvatarWithFrame
              name={user.displayName || 'U'}
              avatarUrl={user.avatar}
              equippedFrame={stats.equippedItems?.frame}
              equippedBadge={stats.equippedItems?.badge}
              size="md"
              isPremium={isPremium}
              showBadge={true}
              onClick={() => setShowMenu(!showMenu)}
            />
            
            {showMenu && (
              <div 
                className="absolute right-0 top-14 w-56 rounded-2xl shadow-2xl overflow-hidden"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(30,30,35,0.98) 0%, rgba(20,20,25,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
              >
                {/* Профиль пользователя */}
                <div className="p-4 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div 
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2 overflow-hidden"
                    style={{ 
                      background: user.avatar ? 'transparent' : (isPremium 
                        ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'
                        : 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)'),
                      color: isPremium ? 'black' : 'white',
                      boxShadow: isPremium ? '0 0 20px rgba(255,215,0,0.5)' : '0 0 15px rgba(255,0,0,0.4)'
                    }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      user.displayName?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <p className="font-medium text-white">{user.displayName || 'Пользователь'}</p>
                  <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                  {isPremium && (
                    <div 
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: 'black' }}
                    >
                      <span>👑</span> Premium
                    </div>
                  )}
                </div>

                {/* Меню */}
                <div className="py-2">
                  <Link
                    href={`/channel/${user.uid}`}
                    className="flex items-center justify-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    <span className="text-xl">👤</span>
                    <span>Мой канал</span>
                  </Link>
                  <Link
                    href="/premium"
                    className="flex items-center justify-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ color: '#ffd700' }}
                    onClick={() => setShowMenu(false)}
                  >
                    <span className="text-xl">👑</span>
                    <span>Premium</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center justify-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    <span className="text-xl">⚙️</span>
                    <span>Настройки</span>
                  </Link>
                </div>

                {/* Выход */}
                <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors"
                    style={{ color: '#ff6b6b' }}
                  >
                    <span className="text-xl">🚪</span>
                    <span>Выйти</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-white/10"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Регистрация
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
