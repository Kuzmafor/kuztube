'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Упрощённая версия без Firebase Realtime Database
// Онлайн статус теперь локальный (можно добавить Supabase Realtime позже)

export function useOnlineStatus() {
  const { user } = useAuth();
  const [onlineCount, setOnlineCount] = useState(1);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOnline(true);
      setOnlineCount(1);
    } else {
      setIsOnline(false);
      setOnlineCount(0);
    }
  }, [user]);

  return { onlineCount, isOnline };
}

export function useUserOnlineStatus(userId: string | null) {
  const { user } = useAuth();
  const [isUserOnline, setIsUserOnline] = useState(false);

  useEffect(() => {
    // Пользователь онлайн если это текущий пользователь
    if (userId && user?.uid === userId) {
      setIsUserOnline(true);
    } else {
      setIsUserOnline(false);
    }
  }, [userId, user]);

  return isUserOnline;
}
