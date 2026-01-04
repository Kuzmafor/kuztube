'use client';

import { useState, useEffect } from 'react';
import { useGamification, SHOP_ITEMS } from '@/lib/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Интерфейс промокода
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

const categories = [
  { id: 'all', name: 'Все', icon: '🛍️' },
  { id: 'frames', name: 'Рамки', icon: '🖼️' },
  { id: 'badges', name: 'Значки', icon: '🏅' },
  { id: 'effects', name: 'Эффекты', icon: '✨' },
  { id: 'boosters', name: 'Бустеры', icon: '⚡' },
  { id: 'themes', name: 'Темы', icon: '🎨' },
];

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'rgba(156,163,175,0.2)', border: 'rgba(156,163,175,0.5)', text: '#9ca3af', glow: 'rgba(156,163,175,0.3)' },
  rare: { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.5)', text: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  epic: { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
  legendary: { bg: 'rgba(255,215,0,0.2)', border: 'rgba(255,215,0,0.5)', text: '#ffd700', glow: 'rgba(255,215,0,0.3)' },
};

const rarityNames: Record<string, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

export default function ShopPage() {
  const { user } = useAuth();
  const { stats, purchaseItem } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Промокоды
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [newPromoAmount, setNewPromoAmount] = useState(50);
  const [newPromoActivations, setNewPromoActivations] = useState(1);
  const [myPromoCodes, setMyPromoCodes] = useState<PromoCode[]>([]);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [customPromoName, setCustomPromoName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);

  // Загрузка промокодов при монтировании
  useEffect(() => {
    if (user) {
      loadMyPromoCodes();
    }
  }, [user]);

  // Загрузка моих промокодов
  const loadMyPromoCodes = () => {
    if (!user) return;
    const allCodes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]') as PromoCode[];
    const myCodes = allCodes.filter(c => c.creatorId === user.uid);
    setMyPromoCodes(myCodes);
  };

  // Генерация случайного кода
  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'KUZ-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Создание промокода
  const handleCreatePromoCode = () => {
    if (!user) return;
    
    const totalCost = newPromoAmount * newPromoActivations;
    const currentBalance = stats.kuzcoins || 0;
    
    if (currentBalance < totalCost) {
      setNotification({ type: 'error', message: `Недостаточно KuzCoin. Нужно: ${totalCost} KC` });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Проверка кастомного названия
    let finalCode = '';
    if (useCustomName && customPromoName.trim()) {
      finalCode = customPromoName.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (finalCode.length < 3) {
        setNotification({ type: 'error', message: 'Название должно быть минимум 3 символа' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      // Проверка на уникальность
      const allCodes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]') as PromoCode[];
      if (allCodes.some(c => c.code === finalCode)) {
        setNotification({ type: 'error', message: 'Такой промокод уже существует' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    } else {
      finalCode = generatePromoCode();
    }
    
    setCreatingPromo(true);
    
    // Списываем монеты
    const userStats = JSON.parse(localStorage.getItem(`kuztube-stats-${user.uid}`) || '{}');
    userStats.kuzcoins = (userStats.kuzcoins || 0) - totalCost;
    localStorage.setItem(`kuztube-stats-${user.uid}`, JSON.stringify(userStats));
    
    // Создаём промокод
    const newCode: PromoCode = {
      id: Date.now().toString(),
      code: finalCode,
      amount: newPromoAmount,
      maxActivations: newPromoActivations,
      currentActivations: 0,
      creatorId: user.uid,
      createdAt: new Date().toISOString(),
      usedBy: []
    };
    
    const allCodes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]') as PromoCode[];
    allCodes.push(newCode);
    localStorage.setItem('kuztube-promocodes', JSON.stringify(allCodes));
    
    loadMyPromoCodes();
    setNotification({ type: 'success', message: `Промокод ${newCode.code} создан! Списано ${totalCost} KC` });
    setTimeout(() => setNotification(null), 5000);
    setCreatingPromo(false);
    setCustomPromoName('');
    
    // Обновляем страницу для обновления баланса
    window.dispatchEvent(new Event('storage'));
  };

  // Активация промокода
  const handleActivatePromoCode = () => {
    if (!user || !promoCodeInput.trim()) return;
    
    const code = promoCodeInput.trim().toUpperCase();
    const allCodes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]') as PromoCode[];
    const promoIndex = allCodes.findIndex(c => c.code === code);
    
    if (promoIndex === -1) {
      setNotification({ type: 'error', message: 'Промокод не найден' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    const promo = allCodes[promoIndex];
    
    if (promo.creatorId === user.uid) {
      setNotification({ type: 'error', message: 'Нельзя активировать свой промокод' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (promo.usedBy.includes(user.uid)) {
      setNotification({ type: 'error', message: 'Вы уже использовали этот промокод' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (promo.currentActivations >= promo.maxActivations) {
      setNotification({ type: 'error', message: 'Промокод исчерпан' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Начисляем монеты
    const userStats = JSON.parse(localStorage.getItem(`kuztube-stats-${user.uid}`) || '{}');
    userStats.kuzcoins = (userStats.kuzcoins || 0) + promo.amount;
    localStorage.setItem(`kuztube-stats-${user.uid}`, JSON.stringify(userStats));
    
    // Обновляем промокод
    allCodes[promoIndex].currentActivations += 1;
    allCodes[promoIndex].usedBy.push(user.uid);
    localStorage.setItem('kuztube-promocodes', JSON.stringify(allCodes));
    
    setPromoCodeInput('');
    setNotification({ type: 'success', message: `Промокод активирован! +${promo.amount} KuzCoin` });
    setTimeout(() => setNotification(null), 3000);
    
    // Обновляем страницу для обновления баланса
    window.dispatchEvent(new Event('storage'));
  };

  // Копирование промокода
  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setNotification({ type: 'success', message: 'Промокод скопирован!' });
    setTimeout(() => setNotification(null), 2000);
  };

  // Удаление промокода
  const deletePromoCode = (codeId: string) => {
    const allCodes = JSON.parse(localStorage.getItem('kuztube-promocodes') || '[]') as PromoCode[];
    const filtered = allCodes.filter(c => c.id !== codeId);
    localStorage.setItem('kuztube-promocodes', JSON.stringify(filtered));
    loadMyPromoCodes();
    setNotification({ type: 'success', message: 'Промокод удалён' });
    setTimeout(() => setNotification(null), 2000);
  };

  const filteredItems = selectedCategory === 'all' 
    ? SHOP_ITEMS 
    : SHOP_ITEMS.filter(item => item.category === selectedCategory);

  const handlePurchase = (itemId: string) => {
    const result = purchaseItem(itemId);
    setNotification({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-6xl mb-4 block">🛒</span>
          <h1 className="text-2xl font-bold text-white mb-2">Магазин KuzCoin</h1>
          <p className="text-gray-400 mb-6">Войдите, чтобы делать покупки за KuzCoin</p>
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
              ? 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9))' 
              : 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9))',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{notification.type === 'success' ? '✅' : '❌'}</span>
            <span className="text-white font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-4xl">🛒</span> Магазин KuzCoin
            </h1>
            <p className="text-gray-400 mt-1">Тратьте заработанные монеты на крутые штуки</p>
          </div>
          
          {/* Баланс */}
          <div 
            className="flex items-center gap-4 px-6 py-4 rounded-2xl"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,170,0,0.1))',
              border: '1px solid rgba(255,215,0,0.3)'
            }}
          >
            <div className="text-4xl">💰</div>
            <div>
              <p className="text-sm text-gray-400">Ваш баланс</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.kuzcoins || 0} KC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о KuzCoin */}
      <div className="max-w-6xl mx-auto mb-8">
        <div 
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,170,0,0.05))',
            border: '1px solid rgba(255,215,0,0.2)'
          }}
        >
          {/* Декоративные монеты */}
          <div className="absolute -right-4 -top-4 text-8xl opacity-10 rotate-12">💰</div>
          <div className="absolute right-20 bottom-2 text-6xl opacity-10 -rotate-12">🪙</div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ 
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                  boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
                }}
              >
                💰
              </div>
              <div>
                <h2 className="text-xl font-bold text-yellow-400">Что такое KuzCoin?</h2>
                <p className="text-sm text-gray-400">Внутренняя валюта KuzTube</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4 leading-relaxed">
              <span className="text-yellow-400 font-semibold">KuzCoin (KC)</span> — это виртуальная валюта платформы KuzTube, 
              которую вы зарабатываете за активность на сайте. Монеты можно потратить на эксклюзивные товары: 
              рамки для аватара, значки, эффекты комментариев, бустеры опыта и уникальные темы оформления.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl">🎁</span>
                <div>
                  <p className="text-white font-medium">Стартовый бонус</p>
                  <p className="text-xs text-yellow-400">+100 KC при регистрации</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl">♾️</span>
                <div>
                  <p className="text-white font-medium">Без ограничений</p>
                  <p className="text-xs text-gray-400">Копите сколько хотите</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-white font-medium">Навсегда ваши</p>
                  <p className="text-xs text-gray-400">Покупки не исчезают</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Категории */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === cat.id 
                  ? 'scale-105' 
                  : 'hover:bg-white/10'
              }`}
              style={selectedCategory === cat.id ? {
                background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                color: 'white'
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: '#9ca3af'
              }}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Товары */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const rarity = rarityColors[item.rarity] || rarityColors.common;
            const isPurchased = stats.purchasedItems?.includes(item.id);
            const canAfford = (stats.kuzcoins || 0) >= item.price;

            return (
              <div
                key={item.id}
                className="relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
                style={{ 
                  background: rarity.bg,
                  border: `2px solid ${rarity.border}`,
                  boxShadow: `0 4px 20px ${rarity.glow}`
                }}
              >
                {/* Редкость */}
                <div 
                  className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                  style={{ background: rarity.border, color: 'white' }}
                >
                  {rarityNames[item.rarity]}
                </div>

                {/* Куплено */}
                {isPurchased && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                    ✓ Куплено
                  </div>
                )}

                <div className="p-5">
                  {/* Иконка */}
                  <div 
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${rarity.border}, ${rarity.bg})`,
                      boxShadow: `0 4px 15px ${rarity.glow}`
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Название */}
                  <h3 className="text-lg font-bold text-white text-center mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">{item.description}</p>

                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      <span className="text-lg font-bold" style={{ color: rarity.text }}>{item.price}</span>
                    </div>

                    <button
                      onClick={() => handlePurchase(item.id)}
                      disabled={isPurchased || !canAfford}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        isPurchased 
                          ? 'bg-green-500/20 text-green-400 cursor-default'
                          : canAfford 
                            ? 'hover:scale-105' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={!isPurchased && canAfford ? {
                        background: `linear-gradient(135deg, ${rarity.border}, ${rarity.text})`,
                        color: 'white'
                      } : isPurchased ? {} : {
                        background: 'rgba(255,255,255,0.1)',
                        color: '#6b7280'
                      }}
                    >
                      {isPurchased ? 'Куплено' : canAfford ? 'Купить' : 'Мало KC'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Как заработать */}
      <div className="max-w-6xl mx-auto mt-12">
        <div 
          className="p-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>💡</span> Как заработать KuzCoin?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">👀</span>
              <div>
                <p className="text-white font-medium">Смотрите видео</p>
                <p className="text-xs text-gray-400">+1 KC за просмотр</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-white font-medium">Комментируйте</p>
                <p className="text-xs text-gray-400">+3 KC за комментарий</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">👍</span>
              <div>
                <p className="text-white font-medium">Ставьте лайки</p>
                <p className="text-xs text-gray-400">+1 KC за лайк</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-white font-medium">Получайте достижения</p>
                <p className="text-xs text-gray-400">+10-1000 KC</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Промокоды */}
      <div className="max-w-6xl mx-auto mt-8">
        <div 
          className="p-6 rounded-2xl"
          style={{ 
            background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(139,92,246,0.05))',
            border: '1px solid rgba(168,85,247,0.2)'
          }}
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span>🎟️</span> Промокоды KuzCoin
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Активация промокода */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <h3 className="font-medium mb-3 flex items-center gap-2 text-white">
                <span>🎁</span> Активировать промокод
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Введите промокод от друга или из акции, чтобы получить KuzCoin
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => {
                    e.preventDefault();
                    setPromoCodeInput(e.target.value.toUpperCase());
                  }}
                  onPaste={(e) => {
                    e.stopPropagation();
                  }}
                  placeholder="Введите промокод"
                  className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={handleActivatePromoCode}
                  disabled={!promoCodeInput.trim()}
                  className="px-5 py-3 rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white' }}
                >
                  Активировать
                </button>
              </div>
            </div>

            {/* Создание промокода */}
            <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <h3 className="font-medium mb-3 flex items-center gap-2 text-white">
                <span>✨</span> Создать промокод
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Создайте промокод и поделитесь им с друзьями
              </p>
              
              {/* Название промокода */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white">Название</label>
                  <button
                    type="button"
                    onClick={() => setUseCustomName(!useCustomName)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${useCustomName ? 'bg-purple-500/30 text-purple-300' : 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {useCustomName ? '✓ Своё название' : 'Рандомное'}
                  </button>
                </div>
                {useCustomName ? (
                  <input
                    type="text"
                    value={customPromoName}
                    onChange={(e) => setCustomPromoName(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="MYCODE123"
                    className="w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    maxLength={15}
                  />
                ) : (
                  <div 
                    className="px-4 py-2 rounded-lg text-center"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="text-gray-400 text-sm">Будет сгенерировано автоматически</span>
                  </div>
                )}
              </div>
              
              {/* Сумма */}
              <div className="mb-4">
                <label className="block text-sm mb-2 text-white">
                  Сумма: <span className="text-yellow-400 font-bold">{newPromoAmount} KC</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={newPromoAmount}
                  onChange={(e) => setNewPromoAmount(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'linear-gradient(90deg, #ffd700, #ffaa00)' }}
                />
              </div>
              
              {/* Количество активаций */}
              <div className="mb-4">
                <label className="block text-sm mb-2 text-white">
                  Активаций: <span className="text-purple-400 font-bold">{newPromoActivations}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={newPromoActivations}
                  onChange={(e) => setNewPromoActivations(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ background: 'linear-gradient(90deg, #a855f7, #7c3aed)' }}
                />
              </div>
              
              {/* Итого */}
              <div 
                className="p-3 rounded-lg mb-4 flex items-center justify-between"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <span className="text-gray-400">Итого:</span>
                <span className={`text-lg font-bold ${(stats.kuzcoins || 0) >= newPromoAmount * newPromoActivations ? 'text-yellow-400' : 'text-red-400'}`}>
                  {newPromoAmount * newPromoActivations} KC
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleCreatePromoCode}
                disabled={creatingPromo || (stats.kuzcoins || 0) < newPromoAmount * newPromoActivations}
                className="w-full px-4 py-3 rounded-xl font-medium transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white' }}
              >
                {creatingPromo ? 'Создание...' : 'Создать промокод'}
              </button>
            </div>
          </div>

          {/* Мои промокоды */}
          {myPromoCodes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3 flex items-center gap-2 text-white">
                <span>📋</span> Мои промокоды
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myPromoCodes.map(promo => (
                  <div 
                    key={promo.id}
                    className="p-4 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div>
                      <code 
                        className="px-3 py-1 rounded-lg font-mono text-sm cursor-pointer hover:bg-white/10 transition-colors block mb-2"
                        style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        onClick={() => copyPromoCode(promo.code)}
                        title="Нажмите, чтобы скопировать"
                      >
                        {promo.code}
                      </code>
                      <div className="text-xs">
                        <span className="text-yellow-400">{promo.amount} KC</span>
                        <span className="mx-2 text-gray-500">•</span>
                        <span className="text-gray-400">
                          {promo.currentActivations}/{promo.maxActivations}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => copyPromoCode(promo.code)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                        title="Копировать"
                      >
                        📋
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePromoCode(promo.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors text-sm"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
