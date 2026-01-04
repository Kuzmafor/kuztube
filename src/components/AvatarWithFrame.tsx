'use client';

import { SHOP_ITEMS } from '@/lib/useGamification';

// Стили рамок
const frameStyles: Record<string, { border: string; shadow: string; animation?: string }> = {
  frame_fire: {
    border: '3px solid #ff6b35',
    shadow: '0 0 15px rgba(255,107,53,0.8), 0 0 30px rgba(255,107,53,0.4)',
    animation: 'pulse-fire 2s ease-in-out infinite'
  },
  frame_ice: {
    border: '3px solid #00d4ff',
    shadow: '0 0 15px rgba(0,212,255,0.8), 0 0 30px rgba(0,212,255,0.4)',
    animation: 'pulse-ice 2s ease-in-out infinite'
  },
  frame_rainbow: {
    border: '3px solid transparent',
    shadow: '0 0 20px rgba(168,85,247,0.6)',
    animation: 'rainbow-border 3s linear infinite'
  },
  frame_gold: {
    border: '3px solid #ffd700',
    shadow: '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4)',
    animation: 'pulse-gold 2s ease-in-out infinite'
  },
};

// Стили значков
const badgeIcons: Record<string, { icon: string; color: string }> = {
  badge_verified: { icon: '✓', color: '#3b82f6' },
  badge_vip: { icon: '⭐', color: '#ffd700' },
  badge_og: { icon: '🎖️', color: '#ffd700' },
};

interface AvatarWithFrameProps {
  name: string;
  avatarUrl?: string | null;
  equippedFrame?: string;
  equippedBadge?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'custom';
  isPremium?: boolean;
  showBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-24 h-24 text-3xl',
  '2xl': 'w-32 h-32 text-4xl',
  '3xl': 'w-40 h-40 text-5xl',
  custom: '', // Для кастомных размеров через className
};

const badgeSizes = {
  sm: 'text-[8px] -right-0.5 -bottom-0.5 w-3 h-3',
  md: 'text-[10px] -right-1 -bottom-1 w-4 h-4',
  lg: 'text-xs -right-1 -bottom-1 w-5 h-5',
  xl: 'text-sm -right-1 -bottom-1 w-6 h-6',
  '2xl': 'text-base -right-2 -bottom-2 w-8 h-8',
  '3xl': 'text-lg -right-2 -bottom-2 w-10 h-10',
  custom: 'text-base -right-2 -bottom-2 w-8 h-8',
};

export default function AvatarWithFrame({
  name,
  avatarUrl,
  equippedFrame,
  equippedBadge,
  size = 'md',
  isPremium = false,
  showBadge = true,
  onClick,
  className = '',
}: AvatarWithFrameProps) {
  const frameStyle = equippedFrame ? frameStyles[equippedFrame] : null;
  const badge = equippedBadge ? badgeIcons[equippedBadge] : null;
  
  const baseStyle: React.CSSProperties = {
    background: avatarUrl ? 'transparent' : 'var(--kuztube-red)',
  };

  if (frameStyle) {
    baseStyle.border = frameStyle.border;
    baseStyle.boxShadow = frameStyle.shadow;
    if (frameStyle.animation) {
      baseStyle.animation = frameStyle.animation;
    }
  }

  // Для радужной рамки используем градиент
  if (equippedFrame === 'frame_rainbow') {
    baseStyle.background = avatarUrl ? 'transparent' : 'var(--kuztube-red)';
    baseStyle.backgroundClip = 'padding-box';
    baseStyle.position = 'relative';
  }

  const Component = onClick ? 'button' : 'div';
  
  // Определяем классы размера
  const sizeClass = size === 'custom' ? '' : sizeClasses[size];
  const badgeSizeClass = badgeSizes[size] || badgeSizes.xl;

  return (
    <div className={`relative inline-block ${size === 'custom' ? className : ''}`}>
      {/* Радужная рамка - отдельный слой */}
      {equippedFrame === 'frame_rainbow' && (
        <div 
          className={`absolute inset-[-3px] rounded-full animate-spin-slow`}
          style={{
            background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080, #ff0000)',
            animationDuration: '3s',
          }}
        />
      )}
      
      <Component
        onClick={onClick}
        className={`${sizeClass} ${size === 'custom' ? 'w-full h-full' : ''} rounded-full flex items-center justify-center font-medium overflow-hidden relative z-10 ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        }`}
        style={baseStyle}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-3xl sm:text-4xl">{name.charAt(0).toUpperCase()}</span>
        )}
      </Component>

      {/* Premium корона */}
      {isPremium && (
        <div className={`absolute -top-1 -right-1 z-20 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
          👑
        </div>
      )}

      {/* Значок */}
      {showBadge && badge && (
        <div 
          className={`absolute z-20 ${badgeSizeClass} rounded-full flex items-center justify-center font-bold`}
          style={{ 
            background: badge.color,
            color: 'white',
            boxShadow: `0 0 8px ${badge.color}`,
          }}
          title={SHOP_ITEMS.find(i => i.id === equippedBadge)?.name}
        >
          {badge.icon === '✓' ? '✓' : ''}
        </div>
      )}
    </div>
  );
}
