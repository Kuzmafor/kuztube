'use client';

import { useEffect, useState } from 'react';

export default function Garland() {
  const [lights, setLights] = useState<{ id: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const colors = ['#ff0000', '#00ff00', '#ffff00', '#00bfff', '#ff69b4', '#ffa500'];
    const lightArray = [];
    const count = 30;
    
    for (let i = 0; i < count; i++) {
      lightArray.push({
        id: i,
        color: colors[i % colors.length],
        delay: (i * 0.1) % 1,
      });
    }
    setLights(lightArray);
  }, []);

  return (
    <div className="fixed top-14 left-0 right-0 z-40 pointer-events-none">
      {/* Провод гирлянды */}
      <svg className="w-full h-16" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          d="M0,10 Q60,40 120,15 Q180,40 240,15 Q300,40 360,15 Q420,40 480,15 Q540,40 600,15 Q660,40 720,15 Q780,40 840,15 Q900,40 960,15 Q1020,40 1080,15 Q1140,40 1200,15"
          fill="none"
          stroke="#1a5c1a"
          strokeWidth="3"
        />
      </svg>
      
      {/* Лампочки */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4" style={{ paddingTop: '8px' }}>
        {lights.map((light) => (
          <div
            key={light.id}
            className="relative animate-twinkle"
            style={{
              animationDelay: `${light.delay}s`,
            }}
          >
            {/* Крепление */}
            <div 
              className="w-2 h-3 mx-auto rounded-t"
              style={{ backgroundColor: '#2d5a2d' }}
            />
            {/* Лампочка */}
            <div
              className="w-4 h-5 rounded-full"
              style={{
                backgroundColor: light.color,
                boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
