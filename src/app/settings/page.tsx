'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useGamification } from '@/lib/useGamification';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { stats } = useGamification();
  
  // Имя пользователя
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Настройки внешнего вида
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [garlandEnabled, setGarlandEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState('default');
  const [customBgImage, setCustomBgImage] = useState('');
  
  // Настройки воспроизведения
  const [autoplay, setAutoplay] = useState(true);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [quality, setQuality] = useState('auto');
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [subtitles, setSubtitles] = useState(false);
  
  // Настройки уведомлений
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [subscriptionNotifications, setSubscriptionNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  
  // Настройки приватности
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [searchHistory, setSearchHistory] = useState(true);
  const [showSubscriptions, setShowSubscriptions] = useState(true);
  const [showLikedVideos, setShowLikedVideos] = useState(false);
  
  // Настройки доступности
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  
  // Premium статус
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    // Проверяем Premium статус
    setIsPremium(localStorage.getItem('kuztube-premium') === 'true');
    
    const savedSettings = localStorage.getItem('kuztube-settings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      setSnowEnabled(s.snowEnabled ?? true);
      setGarlandEnabled(s.garlandEnabled ?? true);
      setDarkMode(s.darkMode ?? true);
      setCompactMode(s.compactMode ?? false);
      setBackgroundTheme(s.backgroundTheme ?? 'default');
      setCustomBgImage(s.customBgImage ?? '');
      setAutoplay(s.autoplay ?? true);
      setAutoplayNext(s.autoplayNext ?? true);
      setQuality(s.quality ?? 'auto');
      setPlaybackSpeed(s.playbackSpeed ?? '1');
      setSubtitles(s.subtitles ?? false);
      setNotifications(s.notifications ?? true);
      setEmailNotifications(s.emailNotifications ?? false);
      setSubscriptionNotifications(s.subscriptionNotifications ?? true);
      setCommentNotifications(s.commentNotifications ?? true);
      setHistoryEnabled(s.historyEnabled ?? true);
      setSearchHistory(s.searchHistory ?? true);
      setShowSubscriptions(s.showSubscriptions ?? true);
      setShowLikedVideos(s.showLikedVideos ?? false);
      setReducedMotion(s.reducedMotion ?? false);
      setHighContrast(s.highContrast ?? false);
      setLargeText(s.largeText ?? false);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      snowEnabled, garlandEnabled, darkMode, compactMode, backgroundTheme, customBgImage,
      autoplay, autoplayNext, quality, playbackSpeed, subtitles,
      notifications, emailNotifications, subscriptionNotifications, commentNotifications,
      historyEnabled, searchHistory, showSubscriptions, showLikedVideos,
      reducedMotion, highContrast, largeText
    };
    localStorage.setItem('kuztube-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }));
    applyBackground(backgroundTheme, customBgImage);
  };

  const applyBackground = (theme: string, customImage: string) => {
    // Удаляем все классы фона
    document.body.classList.forEach(cls => {
      if (cls.startsWith('bg-')) {
        document.body.classList.remove(cls);
      }
    });
    document.body.style.backgroundImage = '';
    
    if (theme === 'custom' && customImage) {
      document.body.classList.add('bg-custom-image');
      document.body.style.backgroundImage = `url(${customImage})`;
    } else if (theme !== 'default') {
      document.body.classList.add(`bg-${theme}`);
    }
  };

  const handleBackgroundChange = (theme: string) => {
    setBackgroundTheme(theme);
    applyBackground(theme, '');
    // Сохраняем с новым значением напрямую
    const settings = {
      snowEnabled, garlandEnabled, darkMode, compactMode, backgroundTheme: theme, customBgImage: theme === 'custom' ? customBgImage : '',
      autoplay, autoplayNext, quality, playbackSpeed, subtitles,
      notifications, emailNotifications, subscriptionNotifications, commentNotifications,
      historyEnabled, searchHistory, showSubscriptions, showLikedVideos,
      reducedMotion, highContrast, largeText
    };
    localStorage.setItem('kuztube-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }));
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomBgImage(result);
      setBackgroundTheme('custom');
      applyBackground('custom', result);
      // Сохраняем с новыми значениями напрямую
      const settings = {
        snowEnabled, garlandEnabled, darkMode, compactMode, backgroundTheme: 'custom', customBgImage: result,
        autoplay, autoplayNext, quality, playbackSpeed, subtitles,
        notifications, emailNotifications, subscriptionNotifications, commentNotifications,
        historyEnabled, searchHistory, showSubscriptions, showLikedVideos,
        reducedMotion, highContrast, largeText
      };
      localStorage.setItem('kuztube-settings', JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }));
    };
    reader.readAsDataURL(file);
  };

  // Применяем фон при загрузке
  useEffect(() => {
    const savedSettings = localStorage.getItem('kuztube-settings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.backgroundTheme) {
        applyBackground(s.backgroundTheme, s.customBgImage || '');
      }
    }
  }, []);

  const handleToggle = (setter: (v: boolean) => void, currentValue: boolean) => {
    const newValue = !currentValue;
    setter(newValue);
    // Сохраняем настройки без setTimeout чтобы избежать race condition
    requestAnimationFrame(() => {
      saveSettings();
    });
  };

  const handleUpdateDisplayName = async () => {
    if (!user || !displayName.trim() || displayName === user.displayName) return;
    
    setSavingName(true);
    try {
      // Обновляем в таблице users
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName.trim() })
        .eq('id', user.uid);
      
      if (error) throw error;
      
      // Обновляем имя автора во всех видео пользователя
      await supabase
        .from('videos')
        .update({ author_name: displayName.trim() })
        .eq('author_id', user.uid);
      
      alert('Имя успешно изменено! Обновите страницу для применения изменений.');
    } catch (error) {
      console.error('Error updating display name:', error);
      alert('Ошибка при сохранении имени');
    } finally {
      setSavingName(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('kuztube-history');
    alert('История просмотров очищена!');
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('kuztube-search-history');
    alert('История поиска очищена!');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-red-600' : 'bg-gray-600'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        {icon} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const SettingRow = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <div>
        <p style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>⚙️ Настройки</h1>

      <div className="space-y-6">
        {/* Внешний вид */}
        <Section icon="🎨" title="Внешний вид">
          {/* Выбор фона */}
          <div className="mb-6">
            <p className="mb-3" style={{ color: 'var(--text-primary)' }}>🖼️ Фон сайта</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Выберите тему фона для всего сайта</p>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
              {[
                { id: 'default', name: 'Стандартный', color: '#0f0f0f' },
                { id: 'gradient-purple', name: 'Фиолетовый', gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' },
                { id: 'gradient-red', name: 'Красный', gradient: 'linear-gradient(135deg, #1a0a0a, #2d1515, #1a0a0a)' },
                { id: 'gradient-green', name: 'Зелёный', gradient: 'linear-gradient(135deg, #0a1a0a, #152d15, #0a1a0a)' },
                { id: 'gradient-blue', name: 'Синий', gradient: 'linear-gradient(135deg, #0a0a1a, #15152d, #0a0a1a)' },
                { id: 'gradient-sunset', name: 'Закат', gradient: 'linear-gradient(135deg, #1a0f1a, #2d1a2d, #1a1a2d, #0f1a1a)' },
                { id: 'gradient-ocean', name: 'Океан', gradient: 'linear-gradient(180deg, #0a1628, #0f2744, #0a1628)' },
                { id: 'gradient-forest', name: 'Лес', gradient: 'linear-gradient(180deg, #0a1a0f, #152d1a, #0a1a0f)' },
                { id: 'gradient-neon', name: 'Неон', gradient: 'linear-gradient(135deg, #0f0f1a, #1a0f2d, #2d0f1a, #0f0f1a)' },
                { id: 'gradient-space', name: 'Космос', gradient: 'linear-gradient(180deg, #000, #0a0a1a, #1a0a2d, #0a0a1a, #000)' },
                { id: 'gradient-fire', name: 'Огонь', gradient: 'linear-gradient(180deg, #1a0a00, #2d1500, #1a0a00)' },
                { id: 'pattern-dots', name: 'Точки', pattern: true },
              ].map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleBackgroundChange(bg.id)}
                  className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 ${
                    backgroundTheme === bg.id ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-black' : ''
                  }`}
                  title={bg.name}
                >
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: bg.gradient || bg.color || '#0f0f0f',
                      ...(bg.pattern && { 
                        background: '#0f0f0f',
                        backgroundImage: 'radial-gradient(circle at 8px 8px, rgba(255,255,255,0.1) 2px, transparent 0)',
                        backgroundSize: '16px 16px'
                      })
                    }}
                  />
                  {backgroundTheme === bg.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Загрузка своего фона - только для Premium */}
            <div 
              className={`p-4 rounded-xl border-2 border-dashed transition-colors relative overflow-hidden ${
                isPremium 
                  ? 'border-gray-700 hover:border-red-500' 
                  : 'border-yellow-600/50 bg-yellow-500/5'
              }`}
            >
              {isPremium ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBgUpload}
                    className="hidden"
                    id="bg-upload"
                  />
                  <label 
                    htmlFor="bg-upload" 
                    className="flex flex-col items-center cursor-pointer"
                  >
                    {customBgImage && backgroundTheme === 'custom' ? (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2">
                        <img src={customBgImage} alt="Custom background" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-sm">Нажмите, чтобы изменить</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl mb-2">🖼️</span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Загрузить своё изображение
                        </span>
                        <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          Максимум 5MB
                        </span>
                      </>
                    )}
                  </label>
                </>
              ) : (
                <div 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => router.push('/premium')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">👑</span>
                    <span className="text-lg font-bold text-yellow-400">Premium</span>
                  </div>
                  <span className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    Загрузка своего фона доступна только с подпиской Premium
                  </span>
                  <button 
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                      color: 'black'
                    }}
                  >
                    Получить Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-700 my-4" />
          
          <SettingRow title="❄️ Падающий снег" description="Зимняя анимация снежинок">
            <Toggle enabled={snowEnabled} onToggle={() => handleToggle(setSnowEnabled, snowEnabled)} />
          </SettingRow>
          <SettingRow title="🎄 Гирлянда" description="Праздничная гирлянда под хедером">
            <Toggle enabled={garlandEnabled} onToggle={() => handleToggle(setGarlandEnabled, garlandEnabled)} />
          </SettingRow>
          <SettingRow title="🌙 Тёмная тема" description="Тёмный режим интерфейса">
            <Toggle enabled={darkMode} onToggle={() => handleToggle(setDarkMode, darkMode)} />
          </SettingRow>
          <SettingRow title="📐 Компактный режим" description="Уменьшенные отступы и элементы">
            <Toggle enabled={compactMode} onToggle={() => handleToggle(setCompactMode, compactMode)} />
          </SettingRow>
        </Section>

        {/* Воспроизведение */}
        <Section icon="▶️" title="Воспроизведение">
          <SettingRow title="Автовоспроизведение" description="Автоматически начинать воспроизведение">
            <Toggle enabled={autoplay} onToggle={() => handleToggle(setAutoplay, autoplay)} />
          </SettingRow>
          <SettingRow title="Следующее видео" description="Автоматически воспроизводить следующее видео">
            <Toggle enabled={autoplayNext} onToggle={() => handleToggle(setAutoplayNext, autoplayNext)} />
          </SettingRow>
          <SettingRow title="Субтитры" description="Показывать субтитры по умолчанию">
            <Toggle enabled={subtitles} onToggle={() => handleToggle(setSubtitles, subtitles)} />
          </SettingRow>
          <SettingRow title="Качество видео" description="Качество воспроизведения по умолчанию">
            <select value={quality} onChange={(e) => { setQuality(e.target.value); setTimeout(saveSettings, 0); }}
              className="px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="auto">Авто</option>
              <option value="2160p">4K (2160p)</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </SettingRow>
          <SettingRow title="Скорость воспроизведения" description="Скорость по умолчанию">
            <select value={playbackSpeed} onChange={(e) => { setPlaybackSpeed(e.target.value); setTimeout(saveSettings, 0); }}
              className="px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">Обычная</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </select>
          </SettingRow>
        </Section>

        {/* Уведомления */}
        <Section icon="🔔" title="Уведомления">
          <SettingRow title="Push-уведомления" description="Получать уведомления в браузере">
            <Toggle enabled={notifications} onToggle={() => handleToggle(setNotifications, notifications)} />
          </SettingRow>
          <SettingRow title="Email-уведомления" description="Получать уведомления на почту">
            <Toggle enabled={emailNotifications} onToggle={() => handleToggle(setEmailNotifications, emailNotifications)} />
          </SettingRow>
          <SettingRow title="Новые видео подписок" description="Уведомления о новых видео от подписок">
            <Toggle enabled={subscriptionNotifications} onToggle={() => handleToggle(setSubscriptionNotifications, subscriptionNotifications)} />
          </SettingRow>
          <SettingRow title="Комментарии" description="Уведомления об ответах на комментарии">
            <Toggle enabled={commentNotifications} onToggle={() => handleToggle(setCommentNotifications, commentNotifications)} />
          </SettingRow>
        </Section>

        {/* Приватность */}
        <Section icon="🔒" title="Приватность">
          <SettingRow title="История просмотров" description="Сохранять историю просмотренных видео">
            <Toggle enabled={historyEnabled} onToggle={() => handleToggle(setHistoryEnabled, historyEnabled)} />
          </SettingRow>
          <SettingRow title="История поиска" description="Сохранять историю поисковых запросов">
            <Toggle enabled={searchHistory} onToggle={() => handleToggle(setSearchHistory, searchHistory)} />
          </SettingRow>
          <SettingRow title="Показывать подписки" description="Другие пользователи видят ваши подписки">
            <Toggle enabled={showSubscriptions} onToggle={() => handleToggle(setShowSubscriptions, showSubscriptions)} />
          </SettingRow>
          <SettingRow title="Показывать понравившиеся" description="Другие видят ваши понравившиеся видео">
            <Toggle enabled={showLikedVideos} onToggle={() => handleToggle(setShowLikedVideos, showLikedVideos)} />
          </SettingRow>
          <div className="flex gap-3 pt-2">
            <button onClick={clearHistory} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm">
              Очистить историю просмотров
            </button>
            <button onClick={clearSearchHistory} className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors text-sm">
              Очистить историю поиска
            </button>
          </div>
        </Section>

        {/* Доступность */}
        <Section icon="♿" title="Доступность">
          <SettingRow title="Уменьшить движение" description="Отключить анимации для комфорта">
            <Toggle enabled={reducedMotion} onToggle={() => handleToggle(setReducedMotion, reducedMotion)} />
          </SettingRow>
          <SettingRow title="Высокий контраст" description="Увеличить контрастность интерфейса">
            <Toggle enabled={highContrast} onToggle={() => handleToggle(setHighContrast, highContrast)} />
          </SettingRow>
          <SettingRow title="Крупный текст" description="Увеличить размер шрифта">
            <Toggle enabled={largeText} onToggle={() => handleToggle(setLargeText, largeText)} />
          </SettingRow>
        </Section>

        {/* Аккаунт */}
        <Section icon="👤" title="Аккаунт">
          <div className="space-y-4">
            {/* Изменение ника */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Имя пользователя
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Введите новый ник"
                  className="flex-1 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={handleUpdateDisplayName}
                  disabled={savingName || !displayName.trim() || displayName === user.displayName}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingName ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Это имя будет отображаться на вашем канале и в комментариях
              </p>
            </div>
            
            {/* Информация об аккаунте */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.displayName || 'Пользователь'}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
              </div>
              <button type="button" onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm">
                Выйти
              </button>
            </div>
            
            {/* Админ-панель */}
            <Link 
              href="/admin"
              className="flex items-center justify-between p-4 rounded-lg transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.1), rgba(200,0,0,0.05))', border: '1px solid rgba(255,0,0,0.2)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-medium text-red-400">Админ-панель</p>
                  <p className="text-xs text-gray-500">Управление сайтом</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
