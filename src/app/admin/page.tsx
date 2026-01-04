'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  isModerator, 
  grantModerator, 
  revokeModerator, 
  getModerators,
  banUser,
  unbanUser,
  isUserBanned,
  warnUser,
  getUserWarnings,
  getModerationLogs,
  BAN_DURATIONS,
  formatBanTimeLeft,
  type ModerationLog
} from '@/lib/moderation';

// Список админов (можно добавить свой uid)
const ADMIN_UIDS = ['admin', 'your-uid-here'];

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  kuzcoins?: number;
  xp?: number;
  level?: number;
  isBanned?: boolean;
  banInfo?: { reason: string; expiresAt: string | null; duration: string } | null;
  isPremium?: boolean;
  isModerator?: boolean;
  warningsCount?: number;
}

interface Video {
  id: string;
  title: string;
  author_name: string;
  author_id: string;
  views: number;
  likes: number;
  created_at: string;
  thumbnail_url: string;
}

interface PromoCode {
  id: string;
  code: string;
  amount: number;
  maxActivations: number;
  currentActivations: number;
  creatorId: string;
  createdAt: string;
  usedBy: string[];
}

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalPromoCodes: number;
  activePromoCodes: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'videos' | 'promocodes' | 'moderation' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalVideos: 0, totalViews: 0, totalPromoCodes: 0, activePromoCodes: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  
  // Модальное окно бана
  const [banModal, setBanModal] = useState<{ user: User; isOpen: boolean } | null>(null);
  const [banDuration, setBanDuration] = useState('1d');
  const [banReason, setBanReason] = useState('');
  
  // Модальное окно предупреждения
  const [warnModal, setWarnModal] = useState<{ user: User; isOpen: boolean } | null>(null);
  const [warnReason, setWarnReason] = useState('');
  
  // Создание промокода
  const [newPromoAmount, setNewPromoAmount] = useState(100);
  const [newPromoActivations, setNewPromoActivations] = useState(10);
  const [customAdminPromoName, setCustomAdminPromoName] = useState('');
  const [useCustomAdminName, setUseCustomAdminName] = useState(false);
  
  // Редактирование пользователя
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState(0);

  // Проверка админа
  const isAdmin = user && (ADMIN_UIDS.includes(user.uid) || user.email === 'admin@kuztube.com' || localStorage.getItem('kuztube-admin') === 'true');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadData();
    }
  }, [user, loading]);

  const loadData = async () => {
    // Загрузка пользователей
    const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (usersData) {
      const moderatorsList = getModerators();
      const enrichedUsers = usersData.map(u => {
        const stats = JSON.parse(localStorage.getItem(`kuztube-stats-${u.id}`) || '{}');
        const banStatus = isUserBanned(u.id);
        const warnings = getUserWarnings(u.id);
        return {
          ...u,
          kuzcoins: stats.kuzcoins || 0,
          xp: stats.xp || 0,
          level: stats.level || 1,
          isBanned: banStatus.banned,
          banInfo: banStatus.info || null,
          isPremium: localStorage.getItem(`kuztube-premium-${u.id}`) === 'true',
          isModerator: moderatorsList.includes(u.id),
          warningsCount: warnings.length
        };
      });
      setUsers(enrichedUsers);
    }

    // Загрузка видео
    const { data: videosData } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (videosData) setVideos(videosData);

    // Загрузка промокодов
    const codes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]');
    setPromoCodes(codes);
    
    // Загрузка логов модерации
    setModerationLogs(getModerationLogs());

    // Статистика
    const totalViews = videosData?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
    const activeCodes = codes.filter((c: PromoCode) => c.currentActivations < c.maxActivations).length;
    setStats({
      totalUsers: usersData?.length || 0,
      totalVideos: videosData?.length || 0,
      totalViews,
      totalPromoCodes: codes.length,
      activePromoCodes: activeCodes
    });
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  // Генерация промокода
  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ADMIN-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Создание админского промокода (бесплатно)
  const handleCreateAdminPromo = () => {
    let finalCode = '';
    
    if (useCustomAdminName && customAdminPromoName.trim()) {
      finalCode = customAdminPromoName.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (finalCode.length < 3) {
        showNotification('error', 'Название должно быть минимум 3 символа');
        return;
      }
      // Проверка на уникальность
      if (promoCodes.some(c => c.code === finalCode)) {
        showNotification('error', 'Такой промокод уже существует');
        return;
      }
    } else {
      finalCode = generatePromoCode();
    }
    
    const newCode: PromoCode = {
      id: Date.now().toString(),
      code: finalCode,
      amount: newPromoAmount,
      maxActivations: newPromoActivations,
      currentActivations: 0,
      creatorId: 'admin',
      createdAt: new Date().toISOString(),
      usedBy: []
    };
    
    const allCodes = [...promoCodes, newCode];
    localStorage.setItem('kuztube-promocodes', JSON.stringify(allCodes));
    setPromoCodes(allCodes);
    setCustomAdminPromoName('');
    showNotification('success', `Промокод ${newCode.code} создан!`);
  };

  // Удаление промокода
  const handleDeletePromo = (codeId: string) => {
    const filtered = promoCodes.filter(c => c.id !== codeId);
    localStorage.setItem('kuztube-promocodes', JSON.stringify(filtered));
    setPromoCodes(filtered);
    showNotification('success', 'Промокод удалён');
  };

  // Изменение баланса пользователя
  const handleUpdateBalance = (userId: string, newBalance: number) => {
    const stats = JSON.parse(localStorage.getItem(`kuztube-stats-${userId}`) || '{}');
    stats.kuzcoins = newBalance;
    localStorage.setItem(`kuztube-stats-${userId}`, JSON.stringify(stats));
    
    setUsers(users.map(u => u.id === userId ? { ...u, kuzcoins: newBalance } : u));
    setEditingUser(null);
    showNotification('success', 'Баланс обновлён');
  };

  // Бан/разбан пользователя
  const handleToggleBan = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    if (targetUser.isBanned) {
      // Разбан
      unbanUser(userId, user!.uid, user!.displayName || 'Админ', targetUser.display_name);
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: false, banInfo: null } : u));
      showNotification('success', 'Пользователь разбанен');
    } else {
      // Открываем модальное окно для бана
      setBanModal({ user: targetUser, isOpen: true });
    }
  };
  
  // Подтверждение бана
  const handleConfirmBan = () => {
    if (!banModal || !user) return;
    
    banUser(
      banModal.user.id,
      user.uid,
      user.displayName || 'Админ',
      banModal.user.display_name,
      banDuration,
      banReason || 'Нарушение правил'
    );
    
    const duration = BAN_DURATIONS.find(d => d.id === banDuration);
    setUsers(users.map(u => u.id === banModal.user.id ? { 
      ...u, 
      isBanned: true, 
      banInfo: {
        reason: banReason || 'Нарушение правил',
        expiresAt: duration?.ms ? new Date(Date.now() + duration.ms).toISOString() : null,
        duration: duration?.label || 'Навсегда'
      }
    } : u));
    
    setBanModal(null);
    setBanReason('');
    setBanDuration('1d');
    showNotification('success', `Пользователь забанен на ${duration?.label}`);
    setModerationLogs(getModerationLogs());
  };
  
  // Выдать предупреждение
  const handleWarn = () => {
    if (!warnModal || !user) return;
    
    warnUser(
      warnModal.user.id,
      user.uid,
      user.displayName || 'Админ',
      warnModal.user.display_name,
      warnReason || 'Предупреждение'
    );
    
    setUsers(users.map(u => u.id === warnModal.user.id ? { 
      ...u, 
      warningsCount: (u.warningsCount || 0) + 1 
    } : u));
    
    setWarnModal(null);
    setWarnReason('');
    showNotification('success', 'Предупреждение выдано');
    setModerationLogs(getModerationLogs());
  };
  
  // Выдать/снять роль модератора
  const handleToggleModerator = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    if (targetUser.isModerator) {
      revokeModerator(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isModerator: false } : u));
      showNotification('success', 'Роль модератора снята');
    } else {
      grantModerator(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isModerator: true } : u));
      showNotification('success', 'Роль модератора выдана');
    }
  };

  // Выдача/снятие Premium
  const handleTogglePremium = (userId: string) => {
    const currentPremium = localStorage.getItem(`kuztube-premium-${userId}`) === 'true';
    localStorage.setItem(`kuztube-premium-${userId}`, (!currentPremium).toString());
    
    setUsers(users.map(u => u.id === userId ? { ...u, isPremium: !currentPremium } : u));
    showNotification('success', currentPremium ? 'Premium снят' : 'Premium выдан');
  };

  // Удаление видео
  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Удалить это видео?')) return;
    
    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (!error) {
      setVideos(videos.filter(v => v.id !== videoId));
      showNotification('success', 'Видео удалено');
    } else {
      showNotification('error', 'Ошибка удаления');
    }
  };

  // Фильтрация
  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) return null;

  // Проверка на админа - показываем кнопку активации
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-6xl mb-4 block">🔐</span>
          <h1 className="text-2xl font-bold text-white mb-2">Админ-панель</h1>
          <p className="text-gray-400 mb-6">Доступ ограничен. Введите код администратора.</p>
          <input
            type="password"
            placeholder="Код доступа"
            className="w-full px-4 py-3 rounded-xl mb-4 outline-none"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value === 'kuztube2024' || input.value === 'admin') {
                  localStorage.setItem('kuztube-admin', 'true');
                  window.location.reload();
                }
              }
            }}
          />
          <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
            ← Вернуться в настройки
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
      {/* Уведомление */}
      {notification && (
        <div 
          className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-fade-in ${
            notification.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
          }`}
        >
          <span className="text-white font-medium">{notification.text}</span>
        </div>
      )}

      {/* Шапка */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)', boxShadow: '0 4px 20px rgba(255,0,0,0.4)' }}
            >
              👑
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Админ-панель</h1>
              <p className="text-gray-400 text-sm">Управление KuzTube</p>
            </div>
          </div>
          <Link 
            href="/settings"
            className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            ← Назад
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Табы */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', icon: '📊', label: 'Дашборд' },
            { id: 'users', icon: '👥', label: 'Пользователи' },
            { id: 'videos', icon: '🎬', label: 'Видео' },
            { id: 'promocodes', icon: '🎟️', label: 'Промокоды' },
            { id: 'moderation', icon: '🛡️', label: 'Модерация' },
            { id: 'settings', icon: '⚙️', label: 'Настройки' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={activeTab === tab.id ? { 
                background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                boxShadow: '0 4px 15px rgba(255,0,0,0.3)'
              } : {}}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Поиск */}
        {(activeTab === 'users' || activeTab === 'videos') && (
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'users' ? 'Поиск пользователей...' : 'Поиск видео...'}
              className="w-full px-5 py-3 rounded-xl outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
        )}

        {/* Дашборд */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '👥', label: 'Пользователей', value: stats.totalUsers, color: '#3b82f6' },
                { icon: '🎬', label: 'Видео', value: stats.totalVideos, color: '#22c55e' },
                { icon: '👁️', label: 'Просмотров', value: stats.totalViews, color: '#f59e0b' },
                { icon: '🎟️', label: 'Промокодов', value: stats.activePromoCodes, color: '#ec4899' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="p-5 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)`, border: `1px solid ${stat.color}44` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Быстрые действия */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚡</span> Быстрые действия
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('promocodes')}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,170,0,0.1))' }}
                >
                  <span className="text-2xl block mb-2">🎟️</span>
                  <span className="text-white font-medium">Создать промокод</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.1))' }}
                >
                  <span className="text-2xl block mb-2">👥</span>
                  <span className="text-white font-medium">Управление юзерами</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('videos')}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))' }}
                >
                  <span className="text-2xl block mb-2">🎬</span>
                  <span className="text-white font-medium">Модерация видео</span>
                </button>
                <button
                  type="button"
                  onClick={() => { localStorage.removeItem('kuztube-admin'); window.location.reload(); }}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))' }}
                >
                  <span className="text-2xl block mb-2">🚪</span>
                  <span className="text-white font-medium">Выйти из админки</span>
                </button>
              </div>
            </div>

            {/* Последние пользователи */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>👥</span> Последние пользователи
              </h2>
              <div className="space-y-2">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {u.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.display_name || 'Без имени'}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-yellow-400 font-medium">{u.kuzcoins || 0} KC</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Все пользователи ({filteredUsers.length})</h2>
            </div>
            
            <div className="grid gap-3">
              {filteredUsers.map(u => (
                <div 
                  key={u.id}
                  className={`p-4 rounded-2xl transition-all ${u.isBanned ? 'opacity-60' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.03)', border: u.isBanned ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden"
                        style={{ background: u.avatar_url ? 'transparent' : 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.display_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{u.display_name || 'Без имени'}</p>
                          {u.isModerator && <span className="text-purple-400" title="Модератор">🛡️</span>}
                          {u.isPremium && <span className="text-yellow-400" title="Premium">👑</span>}
                          {u.isBanned && (
                            <span className="text-red-400 text-xs px-2 py-0.5 rounded-full bg-red-500/20" title={u.banInfo?.reason}>
                              Бан: {u.banInfo ? formatBanTimeLeft(u.banInfo.expiresAt) : ''}
                            </span>
                          )}
                          {(u.warningsCount || 0) > 0 && (
                            <span className="text-orange-400 text-xs px-2 py-0.5 rounded-full bg-orange-500/20">
                              ⚠️ {u.warningsCount}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{u.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="text-yellow-400">💰 {u.kuzcoins || 0} KC</span>
                          <span className="text-blue-400">⭐ {u.xp || 0} XP</span>
                          <span className="text-purple-400">🎖️ Ур. {u.level || 1}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Изменить баланс */}
                      <button
                        type="button"
                        onClick={() => { setEditingUser(u); setEditBalance(u.kuzcoins || 0); }}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(255,215,0,0.2)', color: '#ffd700' }}
                        title="Изменить баланс"
                      >
                        💰
                      </button>
                      
                      {/* Модератор */}
                      <button
                        type="button"
                        onClick={() => handleToggleModerator(u.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                          u.isModerator ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                        }`}
                        title={u.isModerator ? 'Снять модератора' : 'Выдать модератора'}
                      >
                        🛡️ {u.isModerator ? 'Мод' : ''}
                      </button>
                      
                      {/* Premium */}
                      <button
                        type="button"
                        onClick={() => handleTogglePremium(u.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                          u.isPremium ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                        }`}
                        title={u.isPremium ? 'Снять Premium' : 'Выдать Premium'}
                      >
                        👑
                      </button>
                      
                      {/* Предупреждение */}
                      <button
                        type="button"
                        onClick={() => setWarnModal({ user: u, isOpen: true })}
                        className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 bg-orange-500/20 text-orange-400"
                        title="Выдать предупреждение"
                      >
                        ⚠️ {u.warningsCount ? u.warningsCount : ''}
                      </button>
                      
                      {/* Бан */}
                      <button
                        type="button"
                        onClick={() => handleToggleBan(u.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
                          u.isBanned ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}
                        title={u.isBanned ? 'Разбанить' : 'Забанить'}
                      >
                        {u.isBanned ? '✓' : '🚫'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Видео */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Все видео ({filteredVideos.length})</h2>
            </div>
            
            <div className="grid gap-3">
              {filteredVideos.map(v => (
                <div 
                  key={v.id}
                  className="p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-32 h-20 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0"
                    >
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium line-clamp-1">{v.title}</p>
                      <p className="text-gray-500 text-sm">{v.author_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>👁️ {v.views || 0}</span>
                        <span>👍 {v.likes || 0}</span>
                        <span>{new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/watch/${v.id}`}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                      style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6' }}
                    >
                      👁️ Смотреть
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteVideo(v.id)}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredVideos.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl block mb-2">🎬</span>
                  Видео не найдены
                </div>
              )}
            </div>
          </div>
        )}

        {/* Промокоды */}
        {activeTab === 'promocodes' && (
          <div className="space-y-6">
            {/* Создание промокода */}
            <div className="p-6 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,170,0,0.05))', border: '1px solid rgba(255,215,0,0.2)' }}>
              <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>✨</span> Создать админский промокод (бесплатно)
              </h2>
              
              {/* Название промокода */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300">Название промокода</label>
                  <button
                    type="button"
                    onClick={() => setUseCustomAdminName(!useCustomAdminName)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${useCustomAdminName ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {useCustomAdminName ? '✓ Своё название' : 'Рандомное'}
                  </button>
                </div>
                {useCustomAdminName ? (
                  <input
                    type="text"
                    value={customAdminPromoName}
                    onChange={(e) => setCustomAdminPromoName(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="MYCODE123"
                    className="w-full px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500 uppercase"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    maxLength={20}
                  />
                ) : (
                  <div 
                    className="px-4 py-3 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="text-gray-400">Будет сгенерировано: ADMIN-XXXXXX</span>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm mb-2 text-gray-300">
                    Сумма за активацию: <span className="text-yellow-400 font-bold">{newPromoAmount} KC</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="10000"
                    step="10"
                    value={newPromoAmount}
                    onChange={(e) => setNewPromoAmount(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: 'linear-gradient(90deg, #ffd700, #ffaa00)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm mb-2 text-gray-300">
                    Количество активаций: <span className="text-blue-400 font-bold">{newPromoActivations}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    value={newPromoActivations}
                    onChange={(e) => setNewPromoActivations(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }}
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleCreateAdminPromo}
                className="mt-4 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: 'black' }}
              >
                Создать промокод
              </button>
            </div>

            {/* Список промокодов */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span> Все промокоды ({promoCodes.length})
              </h2>
              
              <div className="space-y-3">
                {promoCodes.map(promo => (
                  <div 
                    key={promo.id}
                    className="p-4 rounded-xl flex items-center justify-between flex-wrap gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-center gap-4">
                      <code 
                        className="px-4 py-2 rounded-lg font-mono text-lg cursor-pointer hover:bg-white/10 transition-colors"
                        style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700' }}
                        onClick={() => { navigator.clipboard.writeText(promo.code); showNotification('success', 'Скопировано!'); }}
                      >
                        {promo.code}
                      </code>
                      <div>
                        <p className="text-white">
                          <span className="text-yellow-400 font-bold">{promo.amount} KC</span>
                          <span className="text-gray-500 mx-2">×</span>
                          <span className="text-blue-400">{promo.maxActivations} активаций</span>
                        </p>
                        <p className="text-gray-500 text-sm">
                          Использовано: {promo.currentActivations}/{promo.maxActivations}
                          {promo.creatorId === 'admin' && <span className="ml-2 text-red-400">👑 Админ</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          background: promo.currentActivations >= promo.maxActivations ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                          color: promo.currentActivations >= promo.maxActivations ? '#ef4444' : '#22c55e'
                        }}
                      >
                        {promo.currentActivations >= promo.maxActivations ? 'Исчерпан' : 'Активен'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
                {promoCodes.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl block mb-2">🎟️</span>
                    Промокодов пока нет
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Настройки */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>⚙️</span> Настройки админ-панели
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-white font-medium mb-2">Код доступа к админке</p>
                  <p className="text-gray-500 text-sm mb-3">Текущий код: <code className="text-yellow-400">kuztube2024</code> или <code className="text-yellow-400">admin</code></p>
                </div>
                
                <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <p className="text-red-400 font-medium mb-2">⚠️ Опасная зона</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Вы уверены? Это удалит все промокоды!')) {
                        localStorage.removeItem('kuztube-promocodes');
                        setPromoCodes([]);
                        showNotification('success', 'Все промокоды удалены');
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                  >
                    Удалить все промокоды
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модерация */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            {/* Статистика модерации */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🛡️', label: 'Модераторов', value: getModerators().length, color: '#a855f7' },
                { icon: '🚫', label: 'Забанено', value: users.filter(u => u.isBanned).length, color: '#ef4444' },
                { icon: '⚠️', label: 'Предупреждений', value: users.reduce((sum, u) => sum + (u.warningsCount || 0), 0), color: '#f59e0b' },
                { icon: '📋', label: 'Логов', value: moderationLogs.length, color: '#3b82f6' },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="p-5 rounded-2xl"
                  style={{ background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)`, border: `1px solid ${stat.color}44` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Список модераторов */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                <span>🛡️</span> Модераторы ({getModerators().length})
              </h2>
              
              <div className="grid gap-3">
                {users.filter(u => u.isModerator).map(u => (
                  <div 
                    key={u.id}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
                      >
                        {u.display_name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.display_name}</p>
                        <p className="text-gray-500 text-sm">{u.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleModerator(u.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Снять роль
                    </button>
                  </div>
                ))}
                
                {getModerators().length === 0 && (
                  <p className="text-center py-8 text-gray-500">Модераторов пока нет</p>
                )}
              </div>
            </div>

            {/* Логи модерации */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📋</span> Логи модерации
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {moderationLogs.slice(0, 50).map(log => (
                  <div 
                    key={log.id}
                    className="p-3 rounded-xl flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="text-2xl">
                      {log.action === 'ban' && '🚫'}
                      {log.action === 'unban' && '✅'}
                      {log.action === 'warn' && '⚠️'}
                      {log.action === 'delete_comment' && '🗑️'}
                      {log.action === 'delete_video' && '📹'}
                      {log.action === 'mute' && '🔇'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="text-purple-400">{log.moderatorName}</span>
                        {' → '}
                        <span className="text-gray-400">
                          {log.action === 'ban' && 'забанил'}
                          {log.action === 'unban' && 'разбанил'}
                          {log.action === 'warn' && 'предупредил'}
                          {log.action === 'delete_comment' && 'удалил комментарий'}
                          {log.action === 'delete_video' && 'удалил видео'}
                          {log.action === 'mute' && 'замутил'}
                        </span>
                        {' '}
                        <span className="text-blue-400">{log.targetUserName}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.reason} {log.details && `• ${log.details}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                ))}
                
                {moderationLogs.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Логов пока нет</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования баланса */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'linear-gradient(180deg, #1a1a2e, #0f0f1a)' }}>
            <h3 className="text-xl font-bold text-white mb-4">Изменить баланс</h3>
            <p className="text-gray-400 mb-4">Пользователь: {editingUser.display_name || editingUser.email}</p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Новый баланс KuzCoin</label>
              <input
                type="number"
                value={editBalance}
                onChange={(e) => setEditBalance(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleUpdateBalance(editingUser.id, editBalance)}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно бана */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'linear-gradient(180deg, #1a1a2e, #0f0f1a)' }}>
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span>🚫</span> Забанить пользователя
            </h3>
            <p className="text-gray-400 mb-4">Пользователь: <span className="text-white">{banModal.user.display_name}</span></p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Срок бана</label>
              <div className="grid grid-cols-4 gap-2">
                {BAN_DURATIONS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setBanDuration(d.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      banDuration === d.id ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Причина</label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Нарушение правил"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setBanModal(null); setBanReason(''); }}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
              >
                Забанить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно предупреждения */}
      {warnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-md p-6 rounded-2xl" style={{ background: 'linear-gradient(180deg, #1a1a2e, #0f0f1a)' }}>
            <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              <span>⚠️</span> Выдать предупреждение
            </h3>
            <p className="text-gray-400 mb-4">Пользователь: <span className="text-white">{warnModal.user.display_name}</span></p>
            <p className="text-gray-500 text-sm mb-4">Текущих предупреждений: {warnModal.user.warningsCount || 0}</p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Причина</label>
              <input
                type="text"
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="Укажите причину"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setWarnModal(null); setWarnReason(''); }}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleWarn}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}
              >
                Выдать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
