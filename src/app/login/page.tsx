'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';
import { isUserBanned, formatBanTimeLeft } from '@/lib/moderation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [banMessage, setBanMessage] = useState<{ reason: string; timeLeft: string } | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error!);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error!);
      return;
    }

    setLoading(true);
    
    // Таймаут для логина (15 секунд)
    const loginTimeout = setTimeout(() => {
      setLoading(false);
      setError('Превышено время ожидания. Попробуйте ещё раз.');
    }, 15000);
    
    try {
      await login(email, password);
      clearTimeout(loginTimeout);
      
      // Проверка бана
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (currentUser) {
          const banCheck = isUserBanned(currentUser.id);
          if (banCheck.banned && banCheck.info) {
            setBanMessage({
              reason: banCheck.info.reason,
              timeLeft: formatBanTimeLeft(banCheck.info.expiresAt)
            });
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }
      } catch {
        // Игнорируем ошибку проверки бана, продолжаем вход
      }
      
      router.push('/');
    } catch (err: unknown) {
      clearTimeout(loginTimeout);
      if (err instanceof Error) {
        if (err.message.includes('user-not-found')) {
          setError('Пользователь не найден');
        } else if (err.message.includes('wrong-password') || err.message.includes('invalid-credential')) {
          setError('Неверный пароль');
        } else if (err.message.includes('Invalid API key')) {
          setError('Ошибка конфигурации сервера. Обратитесь к администратору.');
        } else {
          setError('Ошибка входа. Проверьте данные');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    alert(`Авторизация через ${provider} будет доступна в ближайшее время!`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Новогодний фон */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Снежинки */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white/30 animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 5 + 5}s`,
            }}
          >
            ❄
          </div>
        ))}
        {/* Гирлянда сверху */}
        <div className="absolute top-0 left-0 right-0 flex justify-center gap-4 py-2">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                backgroundColor: ['#ff0000', '#00ff00', '#ffff00', '#00ffff', '#ff00ff'][i % 5],
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 10px ${['#ff0000', '#00ff00', '#ffff00', '#00ffff', '#ff00ff'][i % 5]}`,
              }}
            />
          ))}
        </div>
      </div>

      <div 
        className="w-full max-w-md p-8 rounded-2xl relative z-10 border"
        style={{ 
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'rgba(255, 0, 0, 0.3)',
          boxShadow: '0 0 40px rgba(255, 0, 0, 0.1), 0 0 80px rgba(0, 255, 0, 0.05)'
        }}
      >
        {/* Новогодние украшения на карточке */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">🎄</div>
        <div className="absolute -top-2 left-4 text-2xl">🎁</div>
        <div className="absolute -top-2 right-4 text-2xl">⭐</div>

        <h1 className="text-2xl font-bold text-center mb-2 mt-4" style={{ color: 'var(--text-primary)' }}>
          🎅 Вход в KuzTube
        </h1>
        <p className="text-center mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          С Новым Годом! 🎉
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-400 text-sm">
            {error}
          </div>
        )}

        {banMessage && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚫</span>
              <span className="text-red-400 font-bold">Аккаунт заблокирован</span>
            </div>
            <p className="text-sm text-gray-300 mb-1">
              <span className="text-gray-400">Причина:</span> {banMessage.reason}
            </p>
            <p className="text-sm text-gray-300">
              <span className="text-gray-400">Осталось:</span> {banMessage.timeLeft}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all"
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-red-500 transition-all"
              style={{ 
                backgroundColor: 'var(--background)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
              placeholder="Ваш пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? '🎄 Вход...' : '🎁 Войти'}
          </button>
        </form>

        {/* Разделитель */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>или</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
        </div>

        {/* OAuth кнопки */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('Max')}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-3 hover:opacity-90"
            style={{ 
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white'
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              <path d="M12 15l1.57-3.43L17 10l-3.43-1.57L12 5l-1.57 3.43L7 10l3.43 1.57z"/>
            </svg>
            Войти через Max
          </button>
          
          <button
            onClick={() => handleOAuthLogin('Telegram')}
            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-3 hover:opacity-90"
            style={{ 
              backgroundColor: '#0088cc',
              color: 'white'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.325.015.094.034.31.019.478z"/>
            </svg>
            Войти через Telegram
          </button>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Нет аккаунта?{' '}
          <Link href="/register" className="text-red-500 hover:underline font-medium">
            Зарегистрироваться 🎄
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0.3;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}
