'use client';

import { useEffect } from 'react';
import { useGamification } from './useGamification';

// Стили тем
const themeStyles: Record<string, { 
  background: string; 
  accent: string;
  className: string;
}> = {
  theme_neon: {
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0f2d 30%, #2d0f1a 70%, #0a0a1a 100%)',
    accent: '#00ffff',
    className: 'theme-neon',
  },
  theme_retro: {
    background: 'linear-gradient(135deg, #1a1a0a 0%, #2d2d15 50%, #1a1a0a 100%)',
    accent: '#ffaa00',
    className: 'theme-retro',
  },
};

export function useTheme() {
  const { stats } = useGamification();
  const equippedTheme = stats.equippedItems?.theme;

  useEffect(() => {
    // Удаляем все классы тем
    document.body.classList.remove('theme-neon', 'theme-retro');
    
    // Применяем тему если есть
    if (equippedTheme && themeStyles[equippedTheme]) {
      const theme = themeStyles[equippedTheme];
      document.body.classList.add(theme.className);
      
      // Устанавливаем CSS переменные
      document.documentElement.style.setProperty('--theme-accent', theme.accent);
    } else {
      document.documentElement.style.removeProperty('--theme-accent');
    }
  }, [equippedTheme]);

  return {
    currentTheme: equippedTheme,
    themeStyles: equippedTheme ? themeStyles[equippedTheme] : null,
  };
}
