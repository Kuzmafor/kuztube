'use client';

import { useState, useEffect } from 'react';
import { useGamification, SHOP_ITEMS } from '@/lib/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const categories = [
  { id: 'all', name: 'Все предметы', icon: '🎒', color: '#a855f7' },
  { id: 'frames', name: 'Рамки', icon: '🖼️', color: '#3b82f6' },
  { id: 'badges', name: 'Значки', icon: '🏅', color: '#f59e0b' },
  { id: 'effects', name: 'Эффекты', icon: '✨', color: '#ec4899' },
  { id: 'themes', name: 'Темы', icon: '🎨', color: '#10b981' },
  { id: 'boosters', name: 'Бустеры', icon: '⚡', color: '#6366f1' },
];

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string; name: string }> = {
  common: { bg: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.5)', text: '#9ca3af', glow: 'rgba(156,163,175,0.3)', name: 'Обычный' },
  rare: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.5)', text: '#3b82f6', glow: 'rgba(59,130,246,0.3)', name: 'Редкий' },
  epic: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.5)', text: '#a855f7', glow: 'rgba(168,85,247,0.3)', name: 'Эпический' },
  legendary: { bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.5)', text: '#ffd700', glow: 'rgba(255,215,0,0.4)', name: 'Легендарный' },
};

const slotNames: Record<string, string> = {
  frame: 'Рамка',
  badge: 'Значок', 
  effect: 'Эффект',
  theme: 'Тема',
};

export default function InventoryPage() {
  const { user } = useAuth();
  const { stats, equipItem, activateBooster, getActiveBoosts } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [, forceUpdate] = useState(0);

  // Слушаем обновления статистики
  useEffect(() => {
    const handleUpdate = () => {
      forceUpdate(n => n + 1);
    };
    window.addEventListener('kuztube-stats-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('kuztube-stats-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const purchasedItems = stats.purchasedItems || [];
  const equippedItems = stats.equippedItems || {};
  const activeBoosts = getActiveBoosts();
  
  const inventoryItems = SHOP_ITEMS.filter(item => purchasedItems.includes(item.id));
  const filteredItems = selectedCategory === 'all' 
    ? inventoryItems 
    : inventoryItems.filter(item => item.category === selectedCategory);

  const handleEquip = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    
    // Если это бустер - активируем его
    if (item?.category === 'boosters') {
      const result = activateBooster(itemId);
      setNotification({ type: result.success ? 'success' : 'error', message: result.message });
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    
    const result = equipItem(itemId);
    setNotification({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setNotification(null), 2500);
  };

  const isEquipped = (itemId: string) => {
    return Object.values(equippedItems).includes(itemId);
  };

  // Статистика инвентаря
  const totalItems = inventoryItems.length;
  const equippedCount = Object.values(equippedItems).filter(Boolean).length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.price, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-6xl mb-4 block">🎒</span>
          <h1 className="text-2xl font-bold text-white mb-2">Инвентарь</h1>
          <p className="text-gray-400 mb-6">Войдите, чтобы увидеть свои предметы</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl font-medium transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)', color: 'white' }}
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Уведомление */}
      {notification && (
        <div 
          className="fixed top-20 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl animate-fade-in"
          style={{ 
            background: notification.type === 'success' 
              ? 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))' 
              : 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{notification.type === 'success' ? '✅' : '❌'}</span>
            <span className="text-white font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
                  border: '2px solid rgba(168,85,247,0.4)',
                  boxShadow: '0 8px 32px rgba(168,85,247,0.3)'
                }}
              >
                🎒
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Мой инвентарь</h1>
                <p className="text-gray-400">Управляйте своими предметами</p>
              </div>
            </div>
            
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: 'black',
                boxShadow: '0 4px 20px rgba(255,215,0,0.3)'
              }}
            >
              <span>🛒</span> Магазин
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className="p-4 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <p className="text-3xl font-bold text-purple-400">{totalItems}</p>
            <p className="text-sm text-gray-400">Всего предметов</p>
          </div>
          <div 
            className="p-4 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <p className="text-3xl font-bold text-green-400">{equippedCount}</p>
            <p className="text-sm text-gray-400">Надето</p>
          </div>
          <div 
            className="p-4 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,170,0,0.1))', border: '1px solid rgba(255,215,0,0.3)' }}
          >
            <p className="text-3xl font-bold text-yellow-400">{totalValue}</p>
            <p className="text-sm text-gray-400">Общая стоимость KC</p>
          </div>
          <div 
            className="p-4 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <p className="text-3xl font-bold text-blue-400">{stats.kuzcoins || 0}</p>
            <p className="text-sm text-gray-400">Баланс KC</p>
          </div>
        </div>

        {/* Активные предметы */}
        <div 
          className="p-6 rounded-2xl mb-8"
          style={{ 
            background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.05))',
            border: '1px solid rgba(34,197,94,0.2)'
          }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span> Активные предметы
          </h2>
          
          {equippedCount > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['frame', 'badge', 'effect', 'theme'] as const).map(slot => {
                const itemId = equippedItems[slot];
                const item = itemId ? SHOP_ITEMS.find(i => i.id === itemId) : null;
                const rarity = item ? rarityColors[item.rarity] : null;
                
                return (
                  <div 
                    key={slot}
                    className="p-4 rounded-xl text-center relative"
                    style={{ 
                      background: item && rarity ? rarity.bg : 'rgba(255,255,255,0.03)',
                      border: item && rarity ? `2px solid ${rarity.border}` : '2px dashed rgba(255,255,255,0.1)'
                    }}
                  >
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{slotNames[slot]}</p>
                    {item && rarity ? (
                      <>
                        <div 
                          className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-3xl mb-2"
                          style={{ 
                            background: `linear-gradient(135deg, ${rarity.border}, ${rarity.bg})`,
                            boxShadow: `0 4px 20px ${rarity.glow}`
                          }}
                        >
                          {item.icon}
                        </div>
                        <p className="text-sm font-medium text-white mb-1">{item.name}</p>
                        <p className="text-xs" style={{ color: rarity.text }}>{rarity.name}</p>
                        <button
                          type="button"
                          onClick={() => handleEquip(item.id)}
                          className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Снять
                        </button>
                      </>
                    ) : (
                      <div className="py-4">
                        <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center text-2xl mb-2 bg-white/5">
                          ➕
                        </div>
                        <p className="text-sm text-gray-500">Пусто</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">У вас нет активных предметов</p>
              <p className="text-sm text-gray-500">Выберите предметы из инвентаря ниже</p>
            </div>
          )}
        </div>

        {/* Активные бусты */}
        {(activeBoosts.xpBoost > 1 || activeBoosts.coinBoost > 1) && (
          <div 
            className="p-6 rounded-2xl mb-8"
            style={{ 
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.05))',
              border: '1px solid rgba(168,85,247,0.2)'
            }}
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="boost-active">⚡</span> Активные бусты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeBoosts.xpBoost > 1 && (
                <div 
                  className="p-4 rounded-xl flex items-center gap-4"
                  style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl boost-active" style={{ background: 'rgba(168,85,247,0.3)' }}>
                    ⚡
                  </div>
                  <div>
                    <p className="font-medium text-white">XP Буст x2</p>
                    <p className="text-sm text-purple-300">
                      Осталось: {Math.max(0, Math.ceil((activeBoosts.xpBoostEnds - Date.now()) / (1000 * 60 * 60)))} ч.
                    </p>
                  </div>
                </div>
              )}
              {activeBoosts.coinBoost > 1 && (
                <div 
                  className="p-4 rounded-xl flex items-center gap-4"
                  style={{ background: 'rgba(255,215,0,0.2)', border: '1px solid rgba(255,215,0,0.3)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl boost-active" style={{ background: 'rgba(255,215,0,0.3)' }}>
                    💰
                  </div>
                  <div>
                    <p className="font-medium text-white">Coin Буст x2</p>
                    <p className="text-sm text-yellow-300">
                      Осталось: {Math.max(0, Math.ceil((activeBoosts.coinBoostEnds - Date.now()) / (1000 * 60 * 60)))} ч.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Категории */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const count = cat.id === 'all' 
              ? inventoryItems.length 
              : inventoryItems.filter(i => i.category === cat.id).length;
            
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id ? 'scale-105' : 'hover:bg-white/10'
                }`}
                style={selectedCategory === cat.id ? {
                  background: `linear-gradient(135deg, ${cat.color}, ${cat.color}aa)`,
                  color: 'white',
                  boxShadow: `0 4px 15px ${cat.color}44`
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9ca3af'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Предметы */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map(item => {
              const rarity = rarityColors[item.rarity] || rarityColors.common;
              const equipped = isEquipped(item.id);

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.03] cursor-pointer group ${
                    equipped ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black' : ''
                  }`}
                  style={{ 
                    background: rarity.bg,
                    border: `2px solid ${rarity.border}`,
                    boxShadow: equipped ? `0 0 30px ${rarity.glow}` : `0 4px 20px ${rarity.glow}`
                  }}
                  onClick={() => handleEquip(item.id)}
                >
                  {/* Редкость */}
                  <div 
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: rarity.border, color: 'white' }}
                  >
                    {rarity.name}
                  </div>

                  {/* Активно */}
                  {equipped && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white flex items-center gap-1">
                      <span>✓</span> Активно
                    </div>
                  )}

                  <div className="p-4 pt-8">
                    {/* Иконка */}
                    <div 
                      className="w-20 h-20 mx-auto mb-3 rounded-2xl flex items-center justify-center text-4xl transition-transform group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${rarity.border}, ${rarity.bg})`,
                        boxShadow: `0 4px 20px ${rarity.glow}`
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Название */}
                    <h3 className="text-sm font-bold text-white text-center mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-400 text-center mb-3 line-clamp-2">{item.description}</p>

                    {/* Кнопка */}
                    <button
                      type="button"
                      className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                        equipped 
                          ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                          : 'hover:scale-105'
                      }`}
                      style={!equipped ? {
                        background: `linear-gradient(135deg, ${rarity.border}, ${rarity.text})`,
                        color: 'white'
                      } : {}}
                    >
                      {item.category === 'boosters' ? 'Активировать' : (equipped ? 'Снять' : 'Надеть')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            className="text-center py-16 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {selectedCategory === 'all' ? 'Инвентарь пуст' : 'Нет предметов в этой категории'}
            </h3>
            <p className="text-gray-400 mb-6">
              {selectedCategory === 'all' 
                ? 'Купите что-нибудь в магазине, чтобы пополнить коллекцию'
                : 'Попробуйте выбрать другую категорию или посетите магазин'
              }
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: 'black'
              }}
            >
              <span>🛒</span> Перейти в магазин
            </Link>
          </div>
        )}

        {/* Подсказка */}
        <div 
          className="mt-8 p-4 rounded-xl flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm text-gray-300">Нажмите на предмет, чтобы надеть или снять его</p>
            <p className="text-xs text-gray-500">Активные предметы отображаются на вашем профиле и в комментариях</p>
          </div>
        </div>

        {/* Баннер магазина */}
        <Link href="/shop" className="block mt-6">
          <div 
            className="p-6 rounded-2xl relative overflow-hidden transition-all hover:scale-[1.01] group"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,170,0,0.1), rgba(255,100,0,0.05))',
              border: '1px solid rgba(255,215,0,0.3)'
            }}
          >
            {/* Декоративные элементы */}
            <div className="absolute -right-8 -top-8 text-[120px] opacity-10 rotate-12 group-hover:rotate-[20deg] transition-transform">🛒</div>
            <div className="absolute right-24 bottom-0 text-6xl opacity-10 -rotate-12">💎</div>
            <div className="absolute right-48 top-2 text-4xl opacity-10 rotate-6">✨</div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                    boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
                  }}
                >
                  🛒
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Хотите больше предметов?</h3>
                  <p className="text-gray-400 text-sm">
                    Загляните в магазин KuzCoin — там вас ждут рамки, значки, эффекты и многое другое!
                  </p>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all group-hover:scale-105 shrink-0"
                style={{ 
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                  color: 'black',
                  boxShadow: '0 4px 15px rgba(255,215,0,0.3)'
                }}
              >
                <span>Открыть магазин</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
            
            {/* Превью товаров */}
            <div className="mt-4 pt-4 border-t border-yellow-500/20">
              <p className="text-xs text-gray-500 mb-3">Популярные товары:</p>
              <div className="flex flex-wrap gap-2">
                {SHOP_ITEMS.slice(0, 6).map(item => {
                  const rarity = rarityColors[item.rarity] || rarityColors.common;
                  const owned = purchasedItems.includes(item.id);
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${owned ? 'opacity-50' : ''}`}
                      style={{ background: rarity.bg, border: `1px solid ${rarity.border}` }}
                      title={owned ? `${item.name} (уже есть)` : item.name}
                    >
                      <span>{item.icon}</span>
                      <span className="text-white text-xs">{item.name}</span>
                      {owned && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  );
                })}
                <div className="flex items-center px-3 py-1.5 rounded-lg text-xs text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  и ещё {SHOP_ITEMS.length - 6}...
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
