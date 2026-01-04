'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/lib/useGamification';
import AchievementPopup from '@/components/AchievementPopup';
import Link from 'next/link';

const premiumFeatures = [
  {
    icon: '🚫',
    title: 'Без рекламы',
    description: 'Смотрите видео без рекламных пауз и баннеров'
  },
  {
    icon: '⬇️',
    title: 'Скачивание видео',
    description: 'Загружайте видео для просмотра офлайн'
  },
  {
    icon: '🎵',
    title: 'Фоновое воспроизведение',
    description: 'Слушайте видео с выключенным экраном'
  },
  {
    icon: '👑',
    title: 'Эксклюзивный значок',
    description: 'Золотая корона рядом с вашим именем'
  },
  {
    icon: '🎨',
    title: 'Уникальные темы',
    description: 'Доступ к эксклюзивным темам оформления'
  },
  {
    icon: '💬',
    title: 'Приоритетные комментарии',
    description: 'Ваши комментарии выделяются и показываются выше'
  },
  {
    icon: '🎬',
    title: '4K и HDR',
    description: 'Смотрите видео в максимальном качестве'
  },
  {
    icon: '⚡',
    title: 'Ранний доступ',
    description: 'Первыми получайте новые функции платформы'
  },
];

const plans = [
  {
    id: 'monthly',
    name: 'Месячная',
    price: 199,
    period: 'месяц',
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Годовая',
    price: 1499,
    period: 'год',
    popular: true,
    savings: 'Экономия 37%'
  },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const { grantPremiumAchievement, newAchievement } = useGamification();
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const premiumStatus = localStorage.getItem('kuztube-premium');
    setIsPremium(premiumStatus === 'true');
  }, []);

  const handleSubscribe = () => {
    if (!user) return;
    
    localStorage.setItem('kuztube-premium', 'true');
    localStorage.setItem('kuztube-premium-date', new Date().toISOString());
    setIsPremium(true);
    setShowSuccess(true);
    
    // Выдаём достижение за Premium
    grantPremiumAchievement();
    
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    localStorage.removeItem('kuztube-premium');
    localStorage.removeItem('kuztube-premium-date');
    setIsPremium(false);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Achievement Popup */}
      <AchievementPopup achievement={newAchievement} />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)' }}>
          <span className="text-2xl">👑</span>
          <span className="font-bold text-black">KuzTube Premium</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Получите максимум от{' '}
          <span style={{ background: 'linear-gradient(135deg, #ffd700, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            KuzTube
          </span>
        </h1>
        
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Эксклюзивная подписка с уникальными привилегиями для настоящих ценителей контента
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg bg-green-600 text-white font-medium animate-bounce">
          🎉 Добро пожаловать в Premium!
        </div>
      )}

      {/* Premium Status */}
      {isPremium && (
        <div className="max-w-2xl mx-auto mb-8">
          <div 
            className="p-6 rounded-2xl text-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,170,0,0.1) 100%)',
              border: '2px solid #ffd700'
            }}
          >
            <div className="text-4xl mb-3">👑</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffd700' }}>
              Вы Premium пользователь!
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Все привилегии активны. Спасибо за поддержку!
            </p>
            <button
              onClick={handleCancel}
              className="mt-4 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Отменить подписку
            </button>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
          Привилегии Premium
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {premiumFeatures.map((feature, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl text-center transition-transform hover:scale-105"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      {!isPremium && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
            Выберите план
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-6 rounded-2xl text-left transition-all ${
                  selectedPlan === plan.id ? 'ring-2 ring-yellow-500 scale-105' : ''
                }`}
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: 'black' }}
                  >
                    Популярный
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === plan.id ? 'border-yellow-500 bg-yellow-500' : 'border-gray-500'
                    }`}
                  >
                    {selectedPlan === plan.id && <span className="text-black text-xs">✓</span>}
                  </div>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {plan.name}
                  </span>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {plan.price}₽
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>/{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <div className="mt-2 text-sm text-green-500 font-medium">
                    {plan.savings}
                  </div>
                )}
              </button>
            ))}
          </div>

          {user ? (
            <button
              onClick={handleSubscribe}
              className="w-full py-4 rounded-full font-bold text-lg transition-transform hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                color: 'black'
              }}
            >
              Оформить Premium
            </button>
          ) : (
            <div className="text-center">
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Войдите, чтобы оформить подписку
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-3 rounded-full font-medium"
                style={{ 
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                  color: 'black'
                }}
              >
                Войти
              </Link>
            </div>
          )}
          
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            Отмена в любое время. Демо-режим - оплата не требуется.
          </p>
        </div>
      )}
    </div>
  );
}
