'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Уровни пользователя с новогодними иконками
export const LEVELS = [
  { level: 1, name: 'Новичок', minXP: 0, color: '#9ca3af', icon: '❄️' },
  { level: 2, name: 'Зритель', minXP: 100, color: '#22c55e', icon: '🎄' },
  { level: 3, name: 'Активист', minXP: 300, color: '#3b82f6', icon: '⛄' },
  { level: 4, name: 'Фанат', minXP: 600, color: '#8b5cf6', icon: '🎁' },
  { level: 5, name: 'Эксперт', minXP: 1000, color: '#f59e0b', icon: '🌟' },
  { level: 6, name: 'Мастер', minXP: 1500, color: '#ef4444', icon: '🎅' },
  { level: 7, name: 'Легенда', minXP: 2500, color: '#ec4899', icon: '🦌' },
  { level: 8, name: 'Титан', minXP: 4000, color: '#06b6d4', icon: '🎆' },
  { level: 9, name: 'Бог KuzTube', minXP: 6000, color: '#ffd700', icon: '👑' },
];

// Достижения
export const ACHIEVEMENTS = [
  // Просмотры
  { id: 'first_watch', name: 'Первый просмотр', description: 'Посмотрите первое видео', icon: '👀', xp: 10, coins: 10, category: 'views' },
  { id: 'watch_10', name: 'Киноман', description: 'Посмотрите 10 видео', icon: '🎬', xp: 50, coins: 25, category: 'views' },
  { id: 'watch_50', name: 'Марафонец', description: 'Посмотрите 50 видео', icon: '🏃', xp: 150, coins: 75, category: 'views' },
  { id: 'watch_100', name: 'Ненасытный', description: 'Посмотрите 100 видео', icon: '🔥', xp: 300, coins: 150, category: 'views' },
  { id: 'watch_500', name: 'Видеоманьяк', description: 'Посмотрите 500 видео', icon: '🎥', xp: 750, coins: 400, category: 'views' },
  { id: 'watch_1000', name: 'Легенда просмотров', description: 'Посмотрите 1000 видео', icon: '🏆', xp: 1500, coins: 1000, category: 'views' },
  
  // Комментарии
  { id: 'first_comment', name: 'Первое слово', description: 'Оставьте первый комментарий', icon: '💬', xp: 15, coins: 15, category: 'comments' },
  { id: 'comment_10', name: 'Болтун', description: 'Оставьте 10 комментариев', icon: '🗣️', xp: 75, coins: 40, category: 'comments' },
  { id: 'comment_50', name: 'Критик', description: 'Оставьте 50 комментариев', icon: '📝', xp: 200, coins: 100, category: 'comments' },
  { id: 'comment_100', name: 'Философ', description: 'Оставьте 100 комментариев', icon: '🎓', xp: 400, coins: 200, category: 'comments' },
  { id: 'comment_500', name: 'Мастер слова', description: 'Оставьте 500 комментариев', icon: '✍️', xp: 1000, coins: 500, category: 'comments' },
  
  // Лайки
  { id: 'first_like', name: 'Первый лайк', description: 'Поставьте первый лайк', icon: '👍', xp: 5, coins: 5, category: 'likes' },
  { id: 'like_50', name: 'Щедрый', description: 'Поставьте 50 лайков', icon: '❤️', xp: 100, coins: 50, category: 'likes' },
  { id: 'like_100', name: 'Добряк', description: 'Поставьте 100 лайков', icon: '💖', xp: 200, coins: 100, category: 'likes' },
  { id: 'like_500', name: 'Филантроп', description: 'Поставьте 500 лайков', icon: '💝', xp: 500, coins: 250, category: 'likes' },
  { id: 'like_1000', name: 'Сердце KuzTube', description: 'Поставьте 1000 лайков', icon: '💗', xp: 1000, coins: 500, category: 'likes' },
  
  // Подписки
  { id: 'first_sub', name: 'Первая подписка', description: 'Подпишитесь на канал', icon: '🔔', xp: 20, coins: 20, category: 'subs' },
  { id: 'sub_10', name: 'Коллекционер', description: 'Подпишитесь на 10 каналов', icon: '📺', xp: 100, coins: 50, category: 'subs' },
  { id: 'sub_25', name: 'Фанат контента', description: 'Подпишитесь на 25 каналов', icon: '📡', xp: 250, coins: 125, category: 'subs' },
  { id: 'sub_50', name: 'Подписчик года', description: 'Подпишитесь на 50 каналов', icon: '🌟', xp: 500, coins: 250, category: 'subs' },
  
  // Уровни
  { id: 'level_5', name: 'Эксперт', description: 'Достигните 5 уровня', icon: '⭐', xp: 100, coins: 100, category: 'levels' },
  { id: 'level_7', name: 'Легенда', description: 'Достигните 7 уровня', icon: '🌠', xp: 300, coins: 300, category: 'levels' },
  { id: 'level_9', name: 'Бог KuzTube', description: 'Достигните 9 уровня', icon: '👑', xp: 1000, coins: 1000, category: 'levels' },
  
  // Особые
  { id: 'premium', name: 'VIP', description: 'Получите Premium подписку', icon: '👑', xp: 500, coins: 500, category: 'special' },
  { id: 'night_owl', name: 'Ночная сова', description: 'Смотрите видео после полуночи', icon: '🦉', xp: 30, coins: 30, category: 'special' },
  { id: 'early_bird', name: 'Ранняя пташка', description: 'Смотрите видео до 6 утра', icon: '🐦', xp: 30, coins: 30, category: 'special' },
  { id: 'weekend_warrior', name: 'Воин выходных', description: 'Активность в выходные', icon: '⚔️', xp: 50, coins: 50, category: 'special' },
  
  // Новогодние
  { id: 'new_year', name: 'С Новым Годом!', description: 'Посетите KuzTube в новогоднюю ночь', icon: '🎆', xp: 200, coins: 500, category: 'holiday' },
  { id: 'christmas', name: 'Рождественское чудо', description: 'Посетите KuzTube на Рождество', icon: '🎄', xp: 150, coins: 300, category: 'holiday' },
  { id: 'winter_lover', name: 'Любитель зимы', description: 'Посмотрите 10 видео зимой', icon: '❄️', xp: 100, coins: 100, category: 'holiday' },
  
  // Социальные
  { id: 'first_share', name: 'Делиться — значит любить', description: 'Поделитесь видео', icon: '🔗', xp: 25, coins: 25, category: 'social' },
  { id: 'profile_complete', name: 'Личность', description: 'Заполните профиль', icon: '👤', xp: 50, coins: 50, category: 'social' },
  
  // Исследователь
  { id: 'explorer', name: 'Исследователь', description: 'Посетите все разделы сайта', icon: '🧭', xp: 75, coins: 75, category: 'explorer' },
  { id: 'shorts_fan', name: 'Фанат Shorts', description: 'Посмотрите 20 Shorts', icon: '⚡', xp: 100, coins: 100, category: 'explorer' },
  { id: 'history_buff', name: 'Историк', description: 'Посмотрите историю просмотров', icon: '📜', xp: 25, coins: 25, category: 'explorer' },
  
  // Секретные
  { id: 'rickroll', name: 'Рикролл', description: 'Посмотрите Never Gonna Give You Up', icon: '🕺', xp: 50, coins: 100, category: 'secret' },
  { id: 'gangnam', name: 'Опа Гангнам Стайл!', description: 'Посмотрите Gangnam Style', icon: '🐴', xp: 50, coins: 100, category: 'secret' },
  { id: 'despacito', name: 'Деспасито!', description: 'Посмотрите Despacito', icon: '🎸', xp: 50, coins: 100, category: 'secret' },
  
  // Магазин
  { id: 'first_purchase', name: 'Первая покупка', description: 'Купите первый товар в магазине', icon: '🛒', xp: 50, coins: 50, category: 'shop' },
  { id: 'big_spender', name: 'Транжира', description: 'Потратьте 5000 KuzCoin', icon: '💸', xp: 200, coins: 200, category: 'shop' },
  { id: 'collector', name: 'Коллекционер', description: 'Купите 5 товаров', icon: '🎁', xp: 300, coins: 300, category: 'shop' },
];

export interface UserStats {
  xp: number;
  level: number;
  kuzcoins: number; // Валюта KuzCoin
  videosWatched: number;
  commentsPosted: number;
  likesGiven: number;
  subscriptions: number;
  achievements: string[];
  purchasedItems: string[]; // Купленные товары
  equippedItems: { // Активные предметы
    frame?: string;
    badge?: string;
    effect?: string;
    theme?: string;
  };
  activeBoosts?: { // Активные бустеры
    xp_boost_2x?: number; // timestamp окончания
    coin_boost_2x?: number;
  };
  lastActivity: string;
}

const DEFAULT_STATS: UserStats = {
  xp: 0,
  level: 1,
  kuzcoins: 100, // Начальный бонус 100 KuzCoin
  videosWatched: 0,
  commentsPosted: 0,
  likesGiven: 0,
  subscriptions: 0,
  achievements: [],
  purchasedItems: [],
  equippedItems: {},
  activeBoosts: {},
  lastActivity: new Date().toISOString(),
};

// Товары в магазине
export const SHOP_ITEMS = [
  // Рамки для аватара
  { id: 'frame_fire', name: 'Огненная рамка', description: 'Анимированная огненная рамка для аватара', price: 500, icon: '🔥', category: 'frames', rarity: 'rare' },
  { id: 'frame_ice', name: 'Ледяная рамка', description: 'Холодная ледяная рамка для аватара', price: 500, icon: '❄️', category: 'frames', rarity: 'rare' },
  { id: 'frame_rainbow', name: 'Радужная рамка', description: 'Переливающаяся радужная рамка', price: 1000, icon: '🌈', category: 'frames', rarity: 'epic' },
  { id: 'frame_gold', name: 'Золотая рамка', description: 'Престижная золотая рамка', price: 2000, icon: '👑', category: 'frames', rarity: 'legendary' },
  
  // Значки
  { id: 'badge_verified', name: 'Значок верификации', description: 'Синяя галочка рядом с именем', price: 1500, icon: '✓', category: 'badges', rarity: 'epic' },
  { id: 'badge_vip', name: 'VIP значок', description: 'Эксклюзивный VIP статус', price: 3000, icon: '⭐', category: 'badges', rarity: 'legendary' },
  { id: 'badge_og', name: 'OG значок', description: 'Для настоящих ветеранов', price: 5000, icon: '🎖️', category: 'badges', rarity: 'legendary' },
  
  // Эффекты комментариев
  { id: 'comment_glow', name: 'Светящиеся комментарии', description: 'Ваши комментарии будут светиться', price: 800, icon: '✨', category: 'effects', rarity: 'rare' },
  { id: 'comment_animated', name: 'Анимированный ник', description: 'Анимация вашего имени в комментариях', price: 1200, icon: '🎭', category: 'effects', rarity: 'epic' },
  
  // Бустеры
  { id: 'xp_boost_2x', name: 'XP Буст x2', description: 'Удвоение XP на 24 часа', price: 300, icon: '⚡', category: 'boosters', rarity: 'common' },
  { id: 'coin_boost_2x', name: 'Coin Буст x2', description: 'Удвоение KuzCoin на 24 часа', price: 400, icon: '💰', category: 'boosters', rarity: 'common' },
  
  // Эксклюзивные темы
  { id: 'theme_neon', name: 'Неоновая тема', description: 'Эксклюзивная неоновая тема интерфейса', price: 2500, icon: '🌃', category: 'themes', rarity: 'legendary' },
  { id: 'theme_retro', name: 'Ретро тема', description: 'Ностальгическая ретро тема', price: 1500, icon: '📺', category: 'themes', rarity: 'epic' },
];

export function useGamification() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [newAchievement, setNewAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка статистики
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
      if (saved) {
        setStats(JSON.parse(saved));
      }
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [user]);

  // Слушатель кастомного события для обновления состояния
  useEffect(() => {
    const handleStatsUpdate = () => {
      if (user) {
        const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
        if (saved) {
          setStats(JSON.parse(saved));
        }
      }
    };
    
    // Слушаем кастомное событие для обновления в той же вкладке
    window.addEventListener('kuztube-stats-update', handleStatsUpdate);
    // Слушаем storage для обновления между вкладками
    window.addEventListener('storage', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('kuztube-stats-update', handleStatsUpdate);
      window.removeEventListener('storage', handleStatsUpdate);
    };
  }, [user]);

  // Сохранение статистики
  const saveStats = (newStats: UserStats) => {
    if (user && isLoaded) {
      localStorage.setItem(`kuztube-stats-${user.uid}`, JSON.stringify(newStats));
      setStats(newStats);
    }
  };

  // Получить текущий уровень
  const getCurrentLevel = () => {
    return LEVELS.filter(l => l.minXP <= stats.xp).pop() || LEVELS[0];
  };

  // Получить следующий уровень
  const getNextLevel = () => {
    const currentIdx = LEVELS.findIndex(l => l.level === getCurrentLevel().level);
    return LEVELS[currentIdx + 1] || null;
  };

  // Прогресс до следующего уровня (0-100)
  const getLevelProgress = () => {
    const current = getCurrentLevel();
    const next = getNextLevel();
    if (!next) return 100;
    const xpInLevel = stats.xp - current.minXP;
    const xpNeeded = next.minXP - current.minXP;
    return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  };

  // Проверка и выдача достижений
  const checkAchievements = (newStats: UserStats): string[] => {
    const newAchievements: string[] = [];
    
    // Просмотры
    if (newStats.videosWatched >= 1 && !newStats.achievements.includes('first_watch')) {
      newAchievements.push('first_watch');
    }
    if (newStats.videosWatched >= 10 && !newStats.achievements.includes('watch_10')) {
      newAchievements.push('watch_10');
    }
    if (newStats.videosWatched >= 50 && !newStats.achievements.includes('watch_50')) {
      newAchievements.push('watch_50');
    }
    if (newStats.videosWatched >= 100 && !newStats.achievements.includes('watch_100')) {
      newAchievements.push('watch_100');
    }
    if (newStats.videosWatched >= 500 && !newStats.achievements.includes('watch_500')) {
      newAchievements.push('watch_500');
    }
    if (newStats.videosWatched >= 1000 && !newStats.achievements.includes('watch_1000')) {
      newAchievements.push('watch_1000');
    }
    
    // Комментарии
    if (newStats.commentsPosted >= 1 && !newStats.achievements.includes('first_comment')) {
      newAchievements.push('first_comment');
    }
    if (newStats.commentsPosted >= 10 && !newStats.achievements.includes('comment_10')) {
      newAchievements.push('comment_10');
    }
    if (newStats.commentsPosted >= 50 && !newStats.achievements.includes('comment_50')) {
      newAchievements.push('comment_50');
    }
    if (newStats.commentsPosted >= 100 && !newStats.achievements.includes('comment_100')) {
      newAchievements.push('comment_100');
    }
    if (newStats.commentsPosted >= 500 && !newStats.achievements.includes('comment_500')) {
      newAchievements.push('comment_500');
    }
    
    // Лайки
    if (newStats.likesGiven >= 1 && !newStats.achievements.includes('first_like')) {
      newAchievements.push('first_like');
    }
    if (newStats.likesGiven >= 50 && !newStats.achievements.includes('like_50')) {
      newAchievements.push('like_50');
    }
    if (newStats.likesGiven >= 100 && !newStats.achievements.includes('like_100')) {
      newAchievements.push('like_100');
    }
    if (newStats.likesGiven >= 500 && !newStats.achievements.includes('like_500')) {
      newAchievements.push('like_500');
    }
    if (newStats.likesGiven >= 1000 && !newStats.achievements.includes('like_1000')) {
      newAchievements.push('like_1000');
    }
    
    // Подписки
    if (newStats.subscriptions >= 1 && !newStats.achievements.includes('first_sub')) {
      newAchievements.push('first_sub');
    }
    if (newStats.subscriptions >= 10 && !newStats.achievements.includes('sub_10')) {
      newAchievements.push('sub_10');
    }
    if (newStats.subscriptions >= 25 && !newStats.achievements.includes('sub_25')) {
      newAchievements.push('sub_25');
    }
    if (newStats.subscriptions >= 50 && !newStats.achievements.includes('sub_50')) {
      newAchievements.push('sub_50');
    }
    
    // Уровни
    if (newStats.level >= 5 && !newStats.achievements.includes('level_5')) {
      newAchievements.push('level_5');
    }
    if (newStats.level >= 7 && !newStats.achievements.includes('level_7')) {
      newAchievements.push('level_7');
    }
    if (newStats.level >= 9 && !newStats.achievements.includes('level_9')) {
      newAchievements.push('level_9');
    }
    
    // Время суток
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5 && !newStats.achievements.includes('night_owl')) {
      newAchievements.push('night_owl');
    }
    if (hour >= 5 && hour < 7 && !newStats.achievements.includes('early_bird')) {
      newAchievements.push('early_bird');
    }
    
    // Выходные
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && !newStats.achievements.includes('weekend_warrior')) {
      newAchievements.push('weekend_warrior');
    }
    
    // Новогодние (проверяем дату)
    const now = new Date();
    const month = now.getMonth();
    const date = now.getDate();
    
    // Новый год (31 декабря - 1 января)
    if ((month === 11 && date === 31) || (month === 0 && date === 1)) {
      if (!newStats.achievements.includes('new_year')) {
        newAchievements.push('new_year');
      }
    }
    
    // Рождество (7 января или 25 декабря)
    if ((month === 0 && date === 7) || (month === 11 && date === 25)) {
      if (!newStats.achievements.includes('christmas')) {
        newAchievements.push('christmas');
      }
    }
    
    // Зима (декабрь, январь, февраль)
    if ((month === 11 || month === 0 || month === 1) && newStats.videosWatched >= 10) {
      if (!newStats.achievements.includes('winter_lover')) {
        newAchievements.push('winter_lover');
      }
    }
    
    return newAchievements;
  };

  // Добавить XP и проверить достижения
  const addXP = (amount: number, newStats: UserStats) => {
    const updatedStats = { ...newStats, xp: newStats.xp + amount };
    
    // Обновить уровень
    const newLevel = LEVELS.filter(l => l.minXP <= updatedStats.xp).pop();
    if (newLevel) {
      updatedStats.level = newLevel.level;
    }
    
    return updatedStats;
  };

  // Добавить KuzCoin
  const addCoins = (amount: number, newStats: UserStats) => {
    return { ...newStats, kuzcoins: (newStats.kuzcoins || 0) + amount };
  };

  // Записать просмотр видео
  const recordVideoWatch = () => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    // Проверяем активные бусты
    const now = Date.now();
    const boosts = currentStats.activeBoosts || {};
    const xpMultiplier = boosts.xp_boost_2x && boosts.xp_boost_2x > now ? 2 : 1;
    const coinMultiplier = boosts.coin_boost_2x && boosts.coin_boost_2x > now ? 2 : 1;
    
    let newStats = { ...currentStats, videosWatched: currentStats.videosWatched + 1 };
    newStats = addXP(5 * xpMultiplier, newStats); // 5 XP за просмотр (x2 с бустом)
    newStats = addCoins(1 * coinMultiplier, newStats); // 1 KuzCoin за просмотр (x2 с бустом)
    
    const newAchievements = checkAchievements(newStats);
    if (newAchievements.length > 0) {
      newStats.achievements = [...newStats.achievements, ...newAchievements];
      // Добавить XP и KuzCoin за достижения
      newAchievements.forEach(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          newStats = addXP(ach.xp, newStats);
          newStats = addCoins(ach.coins || 0, newStats);
          setNewAchievement(ach);
          setTimeout(() => setNewAchievement(null), 5000);
        }
      });
    }
    
    saveStats(newStats);
  };

  // Записать комментарий
  const recordComment = () => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    // Проверяем активные бусты
    const now = Date.now();
    const boosts = currentStats.activeBoosts || {};
    const xpMultiplier = boosts.xp_boost_2x && boosts.xp_boost_2x > now ? 2 : 1;
    const coinMultiplier = boosts.coin_boost_2x && boosts.coin_boost_2x > now ? 2 : 1;
    
    let newStats = { ...currentStats, commentsPosted: currentStats.commentsPosted + 1 };
    newStats = addXP(10 * xpMultiplier, newStats); // 10 XP за комментарий
    newStats = addCoins(3 * coinMultiplier, newStats); // 3 KuzCoin за комментарий
    
    const newAchievements = checkAchievements(newStats);
    if (newAchievements.length > 0) {
      newStats.achievements = [...newStats.achievements, ...newAchievements];
      newAchievements.forEach(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          newStats = addXP(ach.xp, newStats);
          newStats = addCoins(ach.coins || 0, newStats);
          setNewAchievement(ach);
          setTimeout(() => setNewAchievement(null), 5000);
        }
      });
    }
    
    saveStats(newStats);
  };

  // Записать лайк
  const recordLike = () => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    // Проверяем активные бусты
    const now = Date.now();
    const boosts = currentStats.activeBoosts || {};
    const xpMultiplier = boosts.xp_boost_2x && boosts.xp_boost_2x > now ? 2 : 1;
    const coinMultiplier = boosts.coin_boost_2x && boosts.coin_boost_2x > now ? 2 : 1;
    
    let newStats = { ...currentStats, likesGiven: currentStats.likesGiven + 1 };
    newStats = addXP(2 * xpMultiplier, newStats); // 2 XP за лайк
    newStats = addCoins(1 * coinMultiplier, newStats); // 1 KuzCoin за лайк
    
    const newAchievements = checkAchievements(newStats);
    if (newAchievements.length > 0) {
      newStats.achievements = [...newStats.achievements, ...newAchievements];
      newAchievements.forEach(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          newStats = addXP(ach.xp, newStats);
          newStats = addCoins(ach.coins || 0, newStats);
          setNewAchievement(ach);
          setTimeout(() => setNewAchievement(null), 5000);
        }
      });
    }
    
    saveStats(newStats);
  };

  // Записать подписку
  const recordSubscription = () => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    let newStats = { ...currentStats, subscriptions: currentStats.subscriptions + 1 };
    newStats = addXP(15, newStats); // 15 XP за подписку
    newStats = addCoins(5, newStats); // 5 KuzCoin за подписку
    
    const newAchievements = checkAchievements(newStats);
    if (newAchievements.length > 0) {
      newStats.achievements = [...newStats.achievements, ...newAchievements];
      newAchievements.forEach(achId => {
        const ach = ACHIEVEMENTS.find(a => a.id === achId);
        if (ach) {
          newStats = addXP(ach.xp, newStats);
          newStats = addCoins(ach.coins || 0, newStats);
          setNewAchievement(ach);
          setTimeout(() => setNewAchievement(null), 5000);
        }
      });
    }
    
    saveStats(newStats);
  };

  // Выдать Premium достижение
  const grantPremiumAchievement = () => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    if (currentStats.achievements.includes('premium')) return;
    
    let newStats = { ...currentStats };
    newStats.achievements = [...newStats.achievements, 'premium'];
    const ach = ACHIEVEMENTS.find(a => a.id === 'premium');
    if (ach) {
      newStats = addXP(ach.xp, newStats);
      newStats = addCoins(ach.coins || 0, newStats);
      setNewAchievement(ach);
      setTimeout(() => setNewAchievement(null), 5000);
    }
    
    saveStats(newStats);
  };

  // Купить товар в магазине
  const purchaseItem = (itemId: string): { success: boolean; message: string } => {
    if (!user || !isLoaded) return { success: false, message: 'Необходимо войти в аккаунт' };
    
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Товар не найден' };
    
    if (currentStats.purchasedItems?.includes(itemId)) {
      return { success: false, message: 'Товар уже куплен' };
    }
    
    if ((currentStats.kuzcoins || 0) < item.price) {
      return { success: false, message: 'Недостаточно KuzCoin' };
    }
    
    let newStats = { 
      ...currentStats, 
      kuzcoins: currentStats.kuzcoins - item.price,
      purchasedItems: [...(currentStats.purchasedItems || []), itemId]
    };
    
    // Проверка достижений магазина
    if (!newStats.achievements.includes('first_purchase')) {
      newStats.achievements = [...newStats.achievements, 'first_purchase'];
      const ach = ACHIEVEMENTS.find(a => a.id === 'first_purchase');
      if (ach) {
        newStats = addXP(ach.xp, newStats);
        newStats = addCoins(ach.coins || 0, newStats);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 5000);
      }
    }
    
    // Проверка на коллекционера (5 товаров)
    if (newStats.purchasedItems.length >= 5 && !newStats.achievements.includes('collector')) {
      newStats.achievements = [...newStats.achievements, 'collector'];
      const ach = ACHIEVEMENTS.find(a => a.id === 'collector');
      if (ach) {
        newStats = addXP(ach.xp, newStats);
        newStats = addCoins(ach.coins || 0, newStats);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 5000);
      }
    }
    
    saveStats(newStats);
    // Принудительно обновляем состояние через кастомное событие
    window.dispatchEvent(new Event('kuztube-stats-update'));
    return { success: true, message: `Товар "${item.name}" успешно куплен!` };
  };

  // Проверка секретных достижений по ID видео
  const checkSecretAchievement = (videoId: string) => {
    if (!user || !isLoaded) return;
    
    // Читаем актуальные данные из localStorage
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    let newStats = { ...currentStats };
    let achievementId: string | null = null;
    
    // Рикролл
    if (videoId === 'yt_dQw4w9WgXcQ' && !currentStats.achievements.includes('rickroll')) {
      achievementId = 'rickroll';
    }
    // Гангнам Стайл
    else if (videoId === 'yt_9bZkp7q19f0' && !currentStats.achievements.includes('gangnam')) {
      achievementId = 'gangnam';
    }
    // Деспасито
    else if (videoId === 'yt_kJQP7kiw5Fk' && !currentStats.achievements.includes('despacito')) {
      achievementId = 'despacito';
    }
    
    if (achievementId) {
      newStats.achievements = [...newStats.achievements, achievementId];
      const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (ach) {
        newStats = addXP(ach.xp, newStats);
        setNewAchievement(ach);
        setTimeout(() => setNewAchievement(null), 5000);
      }
      saveStats(newStats);
    }
  };

  // Экипировать/снять предмет
  const equipItem = (itemId: string): { success: boolean; message: string; equipped: boolean } => {
    if (!user || !isLoaded) return { success: false, message: 'Необходимо войти в аккаунт', equipped: false };
    
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Предмет не найден', equipped: false };
    
    if (!currentStats.purchasedItems?.includes(itemId)) {
      return { success: false, message: 'Предмет не куплен', equipped: false };
    }
    
    // Определяем слот по категории
    const slotMap: Record<string, keyof UserStats['equippedItems']> = {
      'frames': 'frame',
      'badges': 'badge',
      'effects': 'effect',
      'themes': 'theme',
    };
    
    const slot = slotMap[item.category];
    if (!slot) return { success: false, message: 'Неизвестная категория', equipped: false };
    
    const equippedItems = currentStats.equippedItems || {};
    const isCurrentlyEquipped = equippedItems[slot] === itemId;
    
    let newStats = { ...currentStats };
    
    if (isCurrentlyEquipped) {
      // Снимаем предмет
      newStats.equippedItems = { ...equippedItems, [slot]: undefined };
      saveStats(newStats);
      // Принудительно обновляем состояние через кастомное событие
      window.dispatchEvent(new Event('kuztube-stats-update'));
      return { success: true, message: `"${item.name}" снят`, equipped: false };
    } else {
      // Надеваем предмет
      newStats.equippedItems = { ...equippedItems, [slot]: itemId };
      saveStats(newStats);
      // Принудительно обновляем состояние через кастомное событие
      window.dispatchEvent(new Event('kuztube-stats-update'));
      return { success: true, message: `"${item.name}" установлен!`, equipped: true };
    }
  };

  // Получить экипированные предметы
  const getEquippedItems = () => {
    if (!user) return {};
    // Читаем напрямую из localStorage для актуальных данных
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.equippedItems || {};
    }
    return stats.equippedItems || {};
  };

  // Активировать бустер
  const activateBooster = (boosterId: string): { success: boolean; message: string } => {
    if (!user || !isLoaded) return { success: false, message: 'Необходимо войти в аккаунт' };
    
    const saved = localStorage.getItem(`kuztube-stats-${user.uid}`);
    const currentStats = saved ? JSON.parse(saved) : DEFAULT_STATS;
    
    if (!currentStats.purchasedItems?.includes(boosterId)) {
      return { success: false, message: 'Бустер не куплен' };
    }
    
    const boostType = boosterId === 'xp_boost_2x' ? 'xp_boost_2x' : 
                      boosterId === 'coin_boost_2x' ? 'coin_boost_2x' : null;
    
    if (!boostType) return { success: false, message: 'Неизвестный бустер' };
    
    // Проверяем, не активен ли уже бустер
    const activeBoosts = currentStats.activeBoosts || {};
    if (activeBoosts[boostType] && activeBoosts[boostType] > Date.now()) {
      return { success: false, message: 'Бустер уже активен' };
    }
    
    // Активируем на 24 часа
    const endTime = Date.now() + 24 * 60 * 60 * 1000;
    const newStats = {
      ...currentStats,
      activeBoosts: { ...activeBoosts, [boostType]: endTime },
      // Удаляем бустер из инвентаря (одноразовый)
      purchasedItems: currentStats.purchasedItems.filter((id: string) => id !== boosterId)
    };
    
    saveStats(newStats);
    window.dispatchEvent(new Event('kuztube-stats-update'));
    
    const boostName = boosterId === 'xp_boost_2x' ? 'XP Буст x2' : 'Coin Буст x2';
    return { success: true, message: `${boostName} активирован на 24 часа!` };
  };

  // Проверить активные бусты
  const getActiveBoosts = () => {
    const now = Date.now();
    const boosts = stats.activeBoosts || {};
    return {
      xpBoost: boosts.xp_boost_2x && boosts.xp_boost_2x > now ? 2 : 1,
      coinBoost: boosts.coin_boost_2x && boosts.coin_boost_2x > now ? 2 : 1,
      xpBoostEnds: boosts.xp_boost_2x || 0,
      coinBoostEnds: boosts.coin_boost_2x || 0,
    };
  };

  return {
    stats,
    isLoaded,
    getCurrentLevel,
    getNextLevel,
    getLevelProgress,
    recordVideoWatch,
    recordComment,
    recordLike,
    recordSubscription,
    grantPremiumAchievement,
    checkSecretAchievement,
    purchaseItem,
    equipItem,
    getEquippedItems,
    activateBooster,
    getActiveBoosts,
    newAchievement,
    ACHIEVEMENTS,
    LEVELS,
    SHOP_ITEMS,
  };
}
