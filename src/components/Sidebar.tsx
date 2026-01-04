'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { useGamification } from '@/lib/useGamification';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsible?: boolean;
}

const menuItems = [
  { icon: '🏠', label: 'Главная', href: '/', gradient: 'from-blue-500 to-cyan-500' },
  { icon: '🔥', label: 'Популярное', href: '/?search=Популярное', gradient: 'from-orange-500 to-red-500' },
  { icon: '⚡', label: 'Shorts', href: '/shorts', gradient: 'from-purple-500 to-pink-500' },
  { icon: '👑', label: 'Premium', href: '/premium', premium: true, gradient: 'from-yellow-400 to-amber-500' },
];

const userMenuItems = [
  { icon: '📺', label: 'Подписки', href: '/subscriptions', gradient: 'from-red-500 to-rose-500' },
  { icon: '🕐', label: 'Смотреть позже', href: '/watch-later', gradient: 'from-indigo-500 to-blue-500' },
  { icon: '📜', label: 'История', href: '/history', gradient: 'from-green-500 to-emerald-500' },
  { icon: '🎒', label: 'Инвентарь', href: '/inventory', gradient: 'from-purple-500 to-violet-500' },
  { icon: '🛒', label: 'Магазин', href: '/shop', gradient: 'from-amber-500 to-yellow-500' },
  { icon: '🏆', label: 'Достижения', href: '/profile', gradient: 'from-yellow-500 to-amber-500' },
  { icon: '👤', label: 'Мой канал', href: '/channel/me', gradient: 'from-violet-500 to-purple-500' },
  { icon: '⬆️', label: 'Загрузить', href: '/upload', gradient: 'from-pink-500 to-rose-500' },
  { icon: '⚙️', label: 'Настройки', href: '/settings', gradient: 'from-gray-500 to-slate-500' },
];

export default function Sidebar({ isOpen, onClose, isCollapsible = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const { onlineCount } = useOnlineStatus();
  const { stats, getCurrentLevel, getLevelProgress, getActiveBoosts } = useGamification();
  const currentLevel = getCurrentLevel();
  const activeBoosts = getActiveBoosts();

  useEffect(() => {
    setIsPremium(localStorage.getItem('kuztube-premium') === 'true');
  }, []);

  // Количество предметов в инвентаре
  const inventoryCount = (stats.purchasedItems || []).length;

  // Collapsed state - show only icons
  const isCollapsed = !isOpen && isCollapsible;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && !isCollapsible && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed top-14 left-0 h-[calc(100vh-56px)] z-40 transition-all duration-300 ${
          !isCollapsible ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
        }`}
        style={{ 
          background: 'linear-gradient(180deg, rgba(24,24,27,0.98) 0%, rgba(15,15,18,0.98) 100%)',
          width: isCollapsed ? '72px' : '260px',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.5)'
        }}
      >
        <div className="py-4 overflow-y-auto h-full custom-scrollbar">
          {/* Основное меню */}
          <div className={`${isCollapsed ? 'px-2' : 'px-3'} mb-4`}>
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Меню
              </p>
            )}
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href.split('?')[0]));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} ${isCollapsed ? 'px-2' : 'px-3'} py-3 rounded-xl mb-1 transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isCollapsed ? 'text-2xl' : 'text-xl'} transition-transform group-hover:scale-110 ${
                    isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + item.gradient + ' bg-opacity-20'
                  }`}
                  style={!isActive ? { background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` } : {}}
                  >
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-white' : item.premium ? 'text-yellow-400' : 'text-gray-300'
                      }`}>
                        {item.label}
                      </span>
                      {item.premium && !isActive && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold">
                          PRO
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Разделитель с градиентом */}
          <div className={`${isCollapsed ? 'mx-2' : 'mx-4'} my-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`} />

          {/* Меню пользователя */}
          {user && (
            <div className={`${isCollapsed ? 'px-2' : 'px-3'}`}>
              {/* Уровень пользователя */}
              <Link href="/profile" onClick={onClose} title={isCollapsed ? `${currentLevel.name} - Уровень ${currentLevel.level}` : undefined}>
                <div 
                  className={`${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'} rounded-xl mb-3 transition-all hover:scale-[1.02]`}
                  style={{ 
                    background: `linear-gradient(135deg, ${currentLevel.color}22, ${currentLevel.color}11)`,
                    border: `1px solid ${currentLevel.color}44`
                  }}
                >
                  {isCollapsed ? (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{ 
                        background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}aa)`,
                        boxShadow: `0 4px 15px ${currentLevel.color}44`
                      }}
                    >
                      {currentLevel.icon}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}aa)`,
                            boxShadow: `0 4px 15px ${currentLevel.color}44`
                          }}
                        >
                          {currentLevel.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: currentLevel.color }}>
                            {currentLevel.name}
                          </p>
                          <p className="text-xs text-gray-400">Уровень {currentLevel.level} • {stats.xp} XP</p>
                        </div>
                      </div>
                      <div 
                        className="h-2 rounded-full overflow-hidden mb-2"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      >
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${getLevelProgress()}%`,
                            background: 'linear-gradient(90deg, #ff0000, #cc0000)',
                            boxShadow: '0 0 10px rgba(255,0,0,0.5)'
                          }}
                        />
                      </div>
                      {/* KuzCoin баланс */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">💰</span>
                          <span className="text-sm font-medium text-yellow-400">{stats.kuzcoins || 0}</span>
                          <span className="text-xs text-gray-500">KC</span>
                        </div>
                        <Link href="/shop" className="text-xs text-gray-400 hover:text-yellow-400 transition-colors">
                          Магазин →
                        </Link>
                      </div>
                      {/* Активные бусты */}
                      {(activeBoosts.xpBoost > 1 || activeBoosts.coinBoost > 1) && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                          {activeBoosts.xpBoost > 1 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs boost-active">
                              <span>⚡</span> XP x2
                            </div>
                          )}
                          {activeBoosts.coinBoost > 1 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs boost-active">
                              <span>💰</span> KC x2
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Link>

              {!isCollapsed && (
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Библиотека
                </p>
              )}
              {userMenuItems.map((item) => {
                const href = item.href === '/channel/me' ? `/channel/${user.uid}` : item.href;
                const isActive = pathname === href;
                const isInventory = item.href === '/inventory';
                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={onClose}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'} ${isCollapsed ? 'px-2' : 'px-3'} py-3 rounded-xl mb-1 transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r ' + item.gradient + ' shadow-lg' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`relative ${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isCollapsed ? 'text-2xl' : 'text-xl'} transition-transform group-hover:scale-110 ${
                      isActive ? 'bg-white/20' : ''
                    }`}
                    style={!isActive ? { background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` } : {}}
                    >
                      {item.icon}
                      {isInventory && inventoryCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-[9px] text-white flex items-center justify-center font-bold">
                          {inventoryCount > 9 ? '9+' : inventoryCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {item.label}
                        </span>
                        {isInventory && inventoryCount > 0 && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {inventoryCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Если не авторизован */}
          {!user && (
            <div className={`${isCollapsed ? 'px-2' : 'px-4'}`}>
              {isCollapsed ? (
                <Link
                  href="/login"
                  onClick={onClose}
                  title="Войти"
                  className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                    boxShadow: '0 4px 15px rgba(255,0,0,0.3)'
                  }}
                >
                  <span className="text-2xl">👤</span>
                </Link>
              ) : (
                <div 
                  className="p-4 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.1), rgba(255,100,100,0.05))' }}
                >
                  <p className="text-sm text-gray-400 mb-3">
                    Войдите, чтобы ставить лайки, комментировать и подписываться
                  </p>
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(255,0,0,0.3)'
                    }}
                  >
                    <span>👤</span>
                    <span>Войти</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Разделитель */}
          <div className={`${isCollapsed ? 'mx-2' : 'mx-4'} my-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent`} />

          {/* Premium баннер для не-премиум пользователей */}
          {user && !isPremium && (
            <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-4`}>
              <Link href="/premium" onClick={onClose} title={isCollapsed ? 'Premium' : undefined}>
                {isCollapsed ? (
                  <div 
                    className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-2xl transition-transform hover:scale-110"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,170,0,0.2))',
                      border: '1px solid rgba(255,215,0,0.4)'
                    }}
                  >
                    👑
                  </div>
                ) : (
                  <div 
                    className="p-4 rounded-2xl transition-transform hover:scale-[1.02]"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,170,0,0.1))',
                      border: '1px solid rgba(255,215,0,0.3)'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">👑</span>
                      <span className="font-bold text-yellow-400">Premium</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Без рекламы, скачивание видео и эксклюзивные функции
                    </p>
                  </div>
                )}
              </Link>
            </div>
          )}

          {/* Футер */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} mt-auto`}>
            {/* Онлайн счётчик */}
            <div 
              className={`${isCollapsed ? 'p-2' : 'p-3'} rounded-xl mb-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))' }}
              title={isCollapsed ? `${onlineCount} онлайн` : undefined}
            >
              <div className="relative">
                <div 
                  className="w-3 h-3 rounded-full bg-green-500"
                  style={{ boxShadow: '0 0 10px rgba(34,197,94,0.8)' }}
                />
                <div 
                  className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping"
                  style={{ opacity: 0.5 }}
                />
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-green-400">
                    {onlineCount} онлайн
                  </p>
                  <p className="text-xs text-gray-500">сейчас на сайте</p>
                </div>
              )}
            </div>

            {/* Logo */}
            <div 
              className={`${isCollapsed ? 'p-2' : 'p-4'} rounded-2xl text-center`}
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}
            >
              <div className={`flex items-center justify-center ${isCollapsed ? '' : 'gap-2 mb-2'}`}>
                <div 
                  className={`${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'} rounded-lg flex items-center justify-center`}
                  style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                >
                  <svg viewBox="0 0 24 24" className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`}>
                    <path d="M8 5v14l11-7z" fill="white"/>
                  </svg>
                </div>
                {!isCollapsed && <span className="font-bold text-white">KuzTube</span>}
              </div>
              {!isCollapsed && (
                <>
                  <p className="text-xs text-gray-500">© 2024 Эксклюзивный тест</p>
                  {isPremium && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: 'black' }}>
                      <span>👑</span> Premium активен
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
