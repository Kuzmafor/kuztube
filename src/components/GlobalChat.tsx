'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  message: string;
  created_at: string;
}

interface UserStats {
  subscriber_count: number;
  video_count: number;
  created_at: string;
}

export default function GlobalChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar: string; stats: UserStats | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка сообщений
  useEffect(() => {
    fetchMessages();
    
    // Подписка на новые сообщения через Realtime
    const channel = supabase
      .channel('global-chat-room')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages' 
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            // Проверяем, нет ли уже такого сообщения (избегаем дубликатов)
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    // Симуляция онлайн счётчика
    const interval = setInterval(() => {
      setOnlineCount(Math.floor(Math.random() * 50) + 10);
    }, 30000);

    return () => {
      console.log('Unsubscribing from chat');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || loading) return;

    const messageText = newMessage.trim();
    setLoading(true);
    setNewMessage(''); // Очищаем сразу для лучшего UX
    
    // Оптимистичное добавление сообщения
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      user_id: user.uid,
      user_name: user.displayName || 'Аноним',
      user_avatar: user.avatar || '',
      message: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.uid,
        user_name: user.displayName || 'Аноним',
        user_avatar: user.avatar || '',
        message: messageText
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Удаляем оптимистичное сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(messageText); // Возвращаем текст
    } else if (data) {
      // Заменяем временное сообщение на реальное
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
    
    setLoading(false);
  };

  const fetchUserStats = async (userId: string, userName: string, userAvatar: string) => {
    const { data: videos } = await supabase
      .from('videos')
      .select('id')
      .eq('author_id', userId);

    const { data: userData } = await supabase
      .from('users')
      .select('subscriber_count, created_at')
      .eq('id', userId)
      .single();

    setSelectedUser({
      id: userId,
      name: userName,
      avatar: userAvatar,
      stats: userData ? {
        subscriber_count: userData.subscriber_count || 0,
        video_count: videos?.length || 0,
        created_at: userData.created_at
      } : null
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <>
      {/* Кнопка открытия чата */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ 
          background: 'linear-gradient(135deg, #ff0000, #cc0000)',
          boxShadow: '0 4px 20px rgba(255,0,0,0.4)'
        }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!isOpen && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-white">
            {onlineCount}
          </span>
        )}
      </button>

      {/* Панель чата */}
      {isOpen && (
        <div 
          className="fixed bottom-20 right-4 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            backgroundColor: 'var(--background-primary)',
            border: '1px solid rgba(255,255,255,0.1)',
            height: '500px'
          }}
        >
          {/* Заголовок */}
          <div 
            className="p-3 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <span className="font-bold text-white">Чат</span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {onlineCount} онлайн
              </span>
            </div>
            <button
              onClick={() => setShowRules(!showRules)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Правила чата"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Правила */}
          {showRules && (
            <div className="p-3 text-xs" style={{ backgroundColor: 'rgba(255,200,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-bold text-yellow-400 mb-1">📜 Правила чата:</p>
              <ul className="text-gray-300 space-y-1">
                <li>• Уважайте других пользователей</li>
                <li>• Запрещён спам и реклама</li>
                <li>• Без оскорблений и мата</li>
                <li>• Не публикуйте личные данные</li>
              </ul>
            </div>
          )}

          {/* Сообщения */}
          <div 
            className="overflow-y-auto p-3 space-y-3"
            style={{ height: showRules ? '280px' : '350px' }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <p>Пока нет сообщений</p>
                <p className="text-sm">Будьте первым!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <button
                    onClick={() => fetchUserStats(msg.user_id, msg.user_name, msg.user_avatar)}
                    className="flex-shrink-0"
                  >
                    {msg.user_avatar ? (
                      <img 
                        src={msg.user_avatar} 
                        alt={msg.user_name}
                        className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-red-500 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-red-500 transition-all">
                        {msg.user_name[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link 
                        href={`/channel/${msg.user_id}`}
                        className="font-medium text-sm hover:text-red-500 transition-colors truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {msg.user_name}
                      </Link>
                      <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-sm break-words" style={{ color: 'var(--text-secondary)' }}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма отправки */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {user ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Написать сообщение..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ 
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || loading}
                  className="px-3 py-2 rounded-xl text-white disabled:opacity-50 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </form>
            ) : (
              <Link 
                href="/login"
                className="block text-center py-2 rounded-xl text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
              >
                Войдите, чтобы писать
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Модалка статистики пользователя */}
      {selectedUser && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div 
            className="relative rounded-2xl p-6 max-w-sm w-full"
            style={{ backgroundColor: 'var(--background-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              {selectedUser.avatar ? (
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {selectedUser.name[0]?.toUpperCase()}
                </div>
              )}
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {selectedUser.name}
              </h3>
              
              {selectedUser.stats && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <p className="text-2xl font-bold text-red-500">{selectedUser.stats.subscriber_count}</p>
                    <p className="text-xs text-gray-400">подписчиков</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <p className="text-2xl font-bold text-blue-500">{selectedUser.stats.video_count}</p>
                    <p className="text-xs text-gray-400">видео</p>
                  </div>
                </div>
              )}
              
              {selectedUser.stats && (
                <p className="text-xs text-gray-500 mb-4">
                  На платформе с {formatDate(selectedUser.stats.created_at)}
                </p>
              )}
              
              <Link
                href={`/channel/${selectedUser.id}`}
                className="block py-2 rounded-xl text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                onClick={() => setSelectedUser(null)}
              >
                Перейти на канал
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
