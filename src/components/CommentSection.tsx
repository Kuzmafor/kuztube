'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification, LEVELS, SHOP_ITEMS } from '@/lib/useGamification';
import Link from 'next/link';
import AvatarWithFrame from './AvatarWithFrame';
import { isModerator, isUserBanned, deleteCommentAsModerator, formatBanTimeLeft } from '@/lib/moderation';

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string;
}

interface UserStats {
  xp: number;
  level: number;
  videosWatched: number;
  commentsPosted: number;
  likesGiven: number;
  subscriptions: number;
  achievements: string[];
  equippedItems?: {
    frame?: string;
    badge?: string;
    effect?: string;
    theme?: string;
  };
}

// Получить статистику пользователя
function getUserStats(userId: string): UserStats | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(`kuztube-stats-${userId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Получить уровень по XP
function getLevelByXP(xp: number) {
  return LEVELS.filter(l => l.minXP <= xp).pop() || LEVELS[0];
}

interface CommentSectionProps {
  videoId: string;
  videoOwnerId: string;
  currentUserId: string | null;
}

// Форматирование даты
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  return date.toLocaleDateString('ru-RU');
}

export default function CommentSection({
  videoId,
  videoOwnerId,
  currentUserId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { recordComment } = useGamification();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<{ banned: boolean; info?: { reason: string; expiresAt: string | null; duration: string } } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ commentId: string; authorId: string; authorName: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  // Проверяем, является ли текущий пользователь модератором
  const userIsModerator = user ? isModerator(user.uid) : false;
  
  // Проверяем бан пользователя
  useEffect(() => {
    if (user) {
      const banCheck = isUserBanned(user.uid);
      setBanInfo(banCheck);
    }
  }, [user]);

  // Загрузка комментариев из localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`kuztube-comments-${videoId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Сортировка: закреплённые сверху, потом по дате
        parsed.sort((a: Comment, b: Comment) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setComments(parsed);
      } catch (e) {
        console.error('Error parsing comments:', e);
      }
    }
  }, [videoId]);

  // Сохранение комментариев в localStorage
  const saveComments = (newComments: Comment[]) => {
    localStorage.setItem(`kuztube-comments-${videoId}`, JSON.stringify(newComments));
    setComments(newComments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;
    
    // Проверяем бан перед отправкой
    const banCheck = isUserBanned(user.uid);
    if (banCheck.banned) {
      setBanInfo(banCheck);
      return;
    }

    setLoading(true);
    
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newComment.trim(),
      authorId: user.uid,
      authorName: user.displayName || 'Пользователь',
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    const newComments = [comment, ...comments];
    saveComments(newComments);
    setNewComment('');
    recordComment(); // Записываем комментарий для геймификации
    setLoading(false);
  };

  const handleDelete = (commentId: string) => {
    const newComments = comments.filter(c => c.id !== commentId);
    saveComments(newComments);
  };

  // Удаление комментария модератором
  const handleModeratorDelete = () => {
    if (!deleteModal || !user || !deleteReason.trim()) return;
    
    const success = deleteCommentAsModerator(
      videoId,
      deleteModal.commentId,
      user.uid,
      user.displayName || 'Модератор',
      deleteModal.authorId,
      deleteModal.authorName,
      deleteReason.trim()
    );
    
    if (success) {
      // Обновляем локальный список комментариев
      const newComments = comments.filter(c => c.id !== deleteModal.commentId);
      setComments(newComments);
    }
    
    setDeleteModal(null);
    setDeleteReason('');
  };

  const handlePin = (commentId: string, currentPinned: boolean) => {
    const newComments = comments.map(c => 
      c.id === commentId ? { ...c, isPinned: !currentPinned } : c
    );
    // Пересортировка
    newComments.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    saveComments(newComments);
  };

  const isVideoOwner = currentUserId === videoOwnerId;
  const isPremium = typeof window !== 'undefined' && localStorage.getItem('kuztube-premium') === 'true';

  return (
    <div className="mt-8">
      {/* Модальное окно удаления комментария модератором */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #1a1a1f, #0f0f12)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🗑️</span> Удаление комментария
            </h3>
            <p className="text-gray-400 mb-4">
              Вы удаляете комментарий пользователя <span className="text-white font-medium">{deleteModal.authorName}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Причина удаления *</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Укажите причину..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDeleteModal(null); setDeleteReason(''); }}
                className="flex-1 py-3 rounded-xl font-medium transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleModeratorDelete}
                disabled={!deleteReason.trim()}
                className="flex-1 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление о бане */}
      {banInfo?.banned && banInfo.info && (
        <div 
          className="mb-6 p-4 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="text-red-400 font-medium">Вы заблокированы</p>
              <p className="text-sm text-gray-400">
                Причина: {banInfo.info.reason}
              </p>
              <p className="text-sm text-gray-400">
                Срок: {banInfo.info.expiresAt ? formatBanTimeLeft(banInfo.info.expiresAt) : 'Навсегда'}
              </p>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
        {comments.length} комментариев
      </h3>

      {/* Comment Form */}
      {user ? (
        banInfo?.banned ? (
          <p className="mb-6 text-sm text-red-400">
            Вы не можете оставлять комментарии, так как заблокированы
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: 'var(--kuztube-red)' }}
            >
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Написать комментарий..."
                className="w-full px-0 py-2 bg-transparent border-b outline-none focus:border-white transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              {newComment.trim() && (
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewComment('')}
                    className="px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-full text-white hover:opacity-90 transition-colors disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ff0000, #cc0000)' }}
                  >
                    {loading ? '...' : 'Отправить'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )
      ) : (
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <a href="/login" className="text-red-500 hover:underline">Войдите</a>, чтобы оставить комментарий
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => {
          const isAuthorPremium = isPremium && comment.authorId === user?.uid;
          const canDelete = comment.authorId === currentUserId || isVideoOwner;
          const authorStats = getUserStats(comment.authorId);
          const authorLevel = authorStats ? getLevelByXP(authorStats.xp) : LEVELS[0];
          const authorFrame = authorStats?.equippedItems?.frame;
          const authorBadge = authorStats?.equippedItems?.badge;
          const authorEffect = authorStats?.equippedItems?.effect;
          const hasGlowEffect = authorEffect === 'comment_glow';
          const hasAnimatedNick = authorEffect === 'comment_animated';
          
          return (
            <div key={comment.id} className="flex gap-3">
              <div className="relative group">
                <Link href={`/channel/${comment.authorId}`}>
                  <AvatarWithFrame
                    name={comment.authorName}
                    equippedFrame={authorFrame}
                    equippedBadge={authorBadge}
                    size="md"
                    isPremium={isAuthorPremium}
                    showBadge={true}
                    className="cursor-pointer transition-transform hover:scale-110"
                  />
                </Link>
                
                {/* Всплывающая карточка профиля */}
                <div 
                  className="absolute left-0 top-12 z-50 w-64 p-4 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(30,30,35,0.98), rgba(20,20,25,0.98))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                      style={{ 
                        background: `linear-gradient(135deg, ${authorLevel.color}, ${authorLevel.color}aa)`,
                        boxShadow: `0 4px 15px ${authorLevel.color}44`
                      }}
                    >
                      {authorLevel.icon}
                    </div>
                    <div>
                      <p className="font-medium text-white flex items-center gap-1">
                        {comment.authorName}
                        {isAuthorPremium && <span className="text-yellow-500">👑</span>}
                      </p>
                      <p className="text-xs" style={{ color: authorLevel.color }}>
                        {authorLevel.name} • Ур. {authorLevel.level}
                      </p>
                    </div>
                  </div>
                  
                  {authorStats && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-gray-400">Просмотров</p>
                        <p className="text-white font-medium">{authorStats.videosWatched}</p>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-gray-400">Комментариев</p>
                        <p className="text-white font-medium">{authorStats.commentsPosted}</p>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-gray-400">Лайков</p>
                        <p className="text-white font-medium">{authorStats.likesGiven}</p>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-gray-400">XP</p>
                        <p className="text-white font-medium">{authorStats.xp}</p>
                      </div>
                    </div>
                  )}
                  
                  {!authorStats && (
                    <p className="text-xs text-gray-400 text-center">Нет статистики</p>
                  )}
                  
                  <Link 
                    href={`/channel/${comment.authorId}`}
                    className="block mt-3 text-center text-xs py-2 rounded-lg transition-colors hover:bg-white/10"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Перейти на канал →
                  </Link>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {comment.isPinned && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                      📌 Закреплено
                    </span>
                  )}
                  <Link href={`/channel/${comment.authorId}`} className="hover:underline">
                    <span 
                      className={`font-medium text-sm flex items-center gap-1 ${hasAnimatedNick ? 'animated-nick' : ''}`} 
                      style={{ color: hasAnimatedNick ? undefined : 'var(--text-primary)' }}
                    >
                      {comment.authorName}
                      {isAuthorPremium && <span className="text-yellow-500">👑</span>}
                    </span>
                  </Link>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(new Date(comment.createdAt))}
                  </span>
                </div>
                <p 
                  className={`mt-1 ${hasGlowEffect ? 'comment-glow' : ''}`} 
                  style={{ color: 'var(--text-primary)' }}
                >
                  {comment.text}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  {isVideoOwner && (
                    <button
                      onClick={() => handlePin(comment.id, comment.isPinned)}
                      className="text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {comment.isPinned ? 'Открепить' : 'Закрепить'}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs px-2 py-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      Удалить
                    </button>
                  )}
                  {/* Кнопка удаления для модератора */}
                  {userIsModerator && !canDelete && comment.authorId !== currentUserId && (
                    <button
                      onClick={() => setDeleteModal({ 
                        commentId: comment.id, 
                        authorId: comment.authorId, 
                        authorName: comment.authorName 
                      })}
                      className="text-xs px-2 py-1 rounded hover:bg-orange-500/20 text-orange-400 transition-colors flex items-center gap-1"
                    >
                      <span>🛡️</span> Удалить (мод)
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            Пока нет комментариев. Будьте первым!
          </p>
        )}
      </div>
    </div>
  );
}
