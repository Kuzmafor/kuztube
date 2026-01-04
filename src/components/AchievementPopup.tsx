'use client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
}

export default function AchievementPopup({ achievement }: AchievementPopupProps) {
  if (!achievement) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 animate-slide-up"
      style={{
        animation: 'slideUp 0.5s ease-out, fadeOut 0.5s ease-in 4.5s forwards'
      }}
    >
      <div 
        className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.95))',
          border: '2px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div 
          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
          style={{ 
            background: 'rgba(255,255,255,0.2)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          {achievement.icon}
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium">🏆 Новое достижение!</p>
          <p className="text-white text-lg font-bold">{achievement.name}</p>
          <p className="text-white/70 text-sm">{achievement.description}</p>
          <p className="text-yellow-300 text-sm font-medium mt-1">+{achievement.xp} XP</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
