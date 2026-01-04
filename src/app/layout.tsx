'use client';

import { useState, useEffect } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import WinterEffects from "@/components/WinterEffects";
import Sidebar from "@/components/Sidebar";
import AchievementPopup from "@/components/AchievementPopup";
import { useGamification } from "@/lib/useGamification";
import { useTheme } from "@/lib/useTheme";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { newAchievement } = useGamification();
  
  // Применяем тему из магазина
  useTheme();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Применяем сохранённый фон при загрузке
  useEffect(() => {
    const savedSettings = localStorage.getItem('kuztube-settings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      if (s.backgroundTheme && s.backgroundTheme !== 'default') {
        // Удаляем все классы фона
        document.body.classList.forEach(cls => {
          if (cls.startsWith('bg-')) {
            document.body.classList.remove(cls);
          }
        });
        
        if (s.backgroundTheme === 'custom' && s.customBgImage) {
          document.body.classList.add('bg-custom-image');
          document.body.style.backgroundImage = `url(${s.customBgImage})`;
        } else {
          document.body.classList.add(`bg-${s.backgroundTheme}`);
        }
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <WinterEffects />
      <Header onMenuClick={toggleSidebar} />
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => isMobile && setSidebarOpen(false)} 
        isCollapsible={!isMobile}
      />
      <main 
        className="pt-14 transition-all duration-300"
        style={{ paddingLeft: !isMobile ? (sidebarOpen ? '260px' : '72px') : '0' }}
      >
        {children}
      </main>
      <AchievementPopup achievement={newAchievement} />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <title>KuzTube</title>
        <meta name="description" content="Видеоплатформа KuzTube - смотрите и делитесь видео" />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
