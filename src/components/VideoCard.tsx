'use client';

import Link from 'next/link';
import { formatViews } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  authorName: string;
  authorId: string;
  authorAvatar?: string;
  views: number;
  duration?: string;
  createdAt?: string;
  hideAuthor?: boolean;
  onDelete?: () => void;
}

export default function VideoCard({ 
  id, 
  title, 
  thumbnail, 
  authorName, 
  authorId,
  authorAvatar,
  views,
  duration,
  createdAt,
  hideAuthor = false,
  onDelete
}: VideoCardProps) {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatar, setAvatar] = useState(authorAvatar || '');
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.uid === authorId;

  // Загружаем аватарку автора если не передана
  useEffect(() => {
    if (!authorAvatar && authorId && !hideAuthor) {
      supabase
        .from('users')
        .select('avatar')
        .eq('id', authorId)
        .single()
        .then(({ data }) => {
          if (data?.avatar) {
            setAvatar(data.avatar);
          }
        });
    }
  }, [authorId, authorAvatar, hideAuthor]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Format relative time
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
    return `${Math.floor(diffDays / 365)} г. назад`;
  };

  const handleAddToWatchLater = () => {
    const watchLater = JSON.parse(localStorage.getItem('kuztube-watch-later') || '[]');
    if (!watchLater.find((v: any) => v.id === id)) {
      watchLater.push({ id, title, thumbnail, authorName, authorId, views, createdAt });
      localStorage.setItem('kuztube-watch-later', JSON.stringify(watchLater));
      alert('Добавлено в "Посмотреть позже"');
    } else {
      alert('Уже в списке');
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/watch/${id}`);
    alert('Ссылка скопирована!');
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      
      setShowDeleteConfirm(false);
      setShowMenu(false);
      if (onDelete) onDelete();
      else window.location.reload();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Ошибка при удалении видео');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = () => {
    alert('Жалоба отправлена. Спасибо за обратную связь!');
    setShowMenu(false);
  };

  return (
    <div 
      className="group cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <Link href={`/watch/${id}`}>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={title} 
              className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
          
          {/* Duration Badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs font-medium text-white">
              {duration}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToWatchLater();
              }}
              title="Посмотреть позже"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button 
              className="absolute top-2 right-12 p-1.5 bg-black/70 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              title="В очередь"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </Link>
      
      {/* Info */}
      <div className="flex gap-3 mt-3">
        {!hideAuthor && (
          <Link href={`/channel/${authorId}`} className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-red-500/50 transition-all">
              {avatar ? (
                <img src={avatar} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                authorName.charAt(0).toUpperCase()
              )}
            </div>
          </Link>
        )}
        
        <div className="flex-1 min-w-0">
          <Link href={`/watch/${id}`}>
            <h3 className="font-medium text-white text-sm leading-5 line-clamp-2 group-hover:text-gray-200 transition-colors">
              {title}
            </h3>
          </Link>
          
          {!hideAuthor && (
            <Link href={`/channel/${authorId}`}>
              <p className="text-sm text-gray-400 mt-1 hover:text-gray-300 transition-colors">
                {authorName}
              </p>
            </Link>
          )}
          
          <div className="flex items-center text-sm text-gray-500 mt-0.5">
            <span>{formatViews(views)} просмотров</span>
            {createdAt && (
              <>
                <span className="mx-1">•</span>
                <span>{getRelativeTime(createdAt)}</span>
              </>
            )}
          </div>
        </div>
        
        {/* More Options Button */}
        <div className="relative" ref={menuRef}>
          <button 
            className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded-full transition-all self-start"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-8 w-56 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Owner Options */}
              {isOwner && (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/upload?edit=${id}`;
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('Функция рекламы скоро будет доступна!');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="flex-1 text-left">Рекламировать</span>
                    <span className="text-xs text-yellow-500 bg-yellow-500/20 px-1.5 py-0.5 rounded">PRO</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert('Аналитика скоро будет доступна!');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Аналитика
                  </button>
                  
                  <div className="h-px bg-gray-700 my-2" />
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить видео
                  </button>
                  
                  <div className="h-px bg-gray-700 my-2" />
                </>
              )}
              
              {/* General Options */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToWatchLater();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Посмотреть позже
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  alert('Добавлено в плейлист!');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить в плейлист
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Поделиться
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const history = JSON.parse(localStorage.getItem('kuztube-not-interested') || '[]');
                  history.push(id);
                  localStorage.setItem('kuztube-not-interested', JSON.stringify(history));
                  alert('Мы учтём ваши предпочтения');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Не интересует
              </button>
              
              {!isOwner && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReport();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Пожаловаться
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="w-full max-w-md bg-gray-800 rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Удалить видео?</h3>
                <p className="text-sm text-gray-400">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Видео "{title}" будет удалено навсегда. Все комментарии и лайки также будут удалены.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-full text-white hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
