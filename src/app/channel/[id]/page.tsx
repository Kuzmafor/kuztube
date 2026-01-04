'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import VideoCard from '@/components/VideoCard';
import { formatViews } from '@/lib/utils';
import AvatarWithFrame from '@/components/AvatarWithFrame';
import { useGamification, LEVELS } from '@/lib/useGamification';

interface Channel {
  id: string;
  displayName: string;
  avatar: string;
  banner: string;
  description: string;
  subscriberCount: number;
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  createdAt: string;
  duration?: string;
}

interface Playlist {
  id: string;
  name: string;
  thumbnail: string;
  videoCount: number;
  icon: string;
  gradient: string;
}

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const { user } = useAuth();
  const { stats } = useGamification();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists' | 'about' | 'community'>('videos');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [sortBy, setSortBy] = useState<'new' | 'popular' | 'old'>('new');
  const [isVerified, setIsVerified] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [ownerStats, setOwnerStats] = useState<{ equippedItems?: { frame?: string; badge?: string } } | null>(null);

  useEffect(() => {
    async function fetchChannel() {
      if (!channelId) return;

      try {
        const { data: channelData, error: channelError } = await supabase
          .from('users')
          .select('*')
          .eq('id', channelId)
          .single();

        if (channelError || !channelData) {
          setLoading(false);
          return;
        }

        setChannel({
          id: channelData.id,
          displayName: channelData.display_name,
          avatar: channelData.avatar || '',
          banner: channelData.banner || '',
          description: channelData.description || '',
          subscriberCount: channelData.subscriber_count || 0,
          createdAt: channelData.created_at,
        });
        setSubscriberCount(channelData.subscriber_count || 0);
        setIsVerified(channelData.subscriber_count >= 100);

        // Загружаем статистику владельца канала для отображения рамок
        const ownerStatsData = localStorage.getItem(`kuztube-stats-${channelId}`);
        if (ownerStatsData) {
          setOwnerStats(JSON.parse(ownerStatsData));
        }

        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .eq('author_id', channelId)
          .order('created_at', { ascending: false });

        if (videosData) {
          const formattedVideos = videosData.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail,
            authorId: v.author_id,
            authorName: v.author_name,
            views: v.views,
            createdAt: v.created_at,
          }));
          setVideos(formattedVideos);
          setTotalViews(videosData.reduce((sum, v) => sum + (v.views || 0), 0));
          setTotalLikes(videosData.reduce((sum, v) => sum + (v.likes || 0), 0));
        }

        // Плейлисты с иконками
        setPlaylists([
          { id: '1', name: 'Все видео', thumbnail: '', videoCount: videosData?.length || 0, icon: '📺', gradient: 'from-red-500 to-pink-500' },
          { id: '2', name: 'Популярное', thumbnail: '', videoCount: 0, icon: '🔥', gradient: 'from-orange-500 to-red-500' },
          { id: '3', name: 'Shorts', thumbnail: '', videoCount: 0, icon: '⚡', gradient: 'from-purple-500 to-pink-500' },
        ]);

        if (user) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('subscriber_id', user.uid)
            .eq('channel_id', channelId)
            .single();
          
          setIsSubscribed(!!subData);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChannel();
  }, [channelId, user]);

  const handleSubscribe = async () => {
    if (!user || !channel) return;

    if (isSubscribed) {
      await supabase.from('subscriptions').delete().eq('subscriber_id', user.uid).eq('channel_id', channelId);
      await supabase.from('users').update({ subscriber_count: Math.max(0, subscriberCount - 1) }).eq('id', channelId);
      setIsSubscribed(false);
      setSubscriberCount(s => Math.max(0, s - 1));
    } else {
      await supabase.from('subscriptions').insert({ subscriber_id: user.uid, channel_id: channelId });
      await supabase.from('users').update({ subscriber_count: subscriberCount + 1 }).eq('id', channelId);
      setIsSubscribed(true);
      setSubscriberCount(s => s + 1);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !channel) return;

    // Проверка размера (макс 5MB для баннера)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    setUploadingBanner(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const { error } = await supabase
          .from('users')
          .update({ banner: base64 })
          .eq('id', user.uid);

        if (error) {
          console.error('Error updating banner:', error);
          alert('Ошибка при обновлении баннера');
        } else {
          setChannel({ ...channel, banner: base64 });
          alert('Баннер обновлён!');
        }
        setUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error:', err);
      setUploadingBanner(false);
    }
  };

  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'old') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return b.views - a.views;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Загрузка канала...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <span className="text-4xl">😕</span>
        </div>
        <h1 className="text-xl font-medium mb-2 text-white">Канал не найден</h1>
        <p className="text-gray-400 mb-4">Возможно, он был удалён или не существует</p>
        <Link href="/" className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors">
          На главную
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === channelId;

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Banner */}
      <div className="relative w-full h-40 sm:h-52 md:h-64 lg:h-72 overflow-hidden">
        {channel.banner ? (
          <img src={channel.banner} alt="Баннер" className="w-full h-full object-cover" />
        ) : (
          <div 
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)'
            }}
          >
            {/* Декоративные элементы */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-red-500/10 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        {/* Кнопка редактирования баннера */}
        {isOwner && (
          <>
            <input
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerChange}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-black/70 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploadingBanner ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {uploadingBanner ? 'Загрузка...' : 'Изменить баннер'}
            </button>
          </>
        )}
      </div>

      {/* Channel Info */}
      <div className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#0f0f0f] shadow-2xl bg-gray-800">
              <AvatarWithFrame
                name={channel.displayName}
                avatarUrl={channel.avatar}
                equippedFrame={isOwner ? stats.equippedItems?.frame : ownerStats?.equippedItems?.frame}
                equippedBadge={isOwner ? stats.equippedItems?.badge : ownerStats?.equippedItems?.badge}
                size="custom"
                isPremium={false}
                showBadge={true}
                className="w-full h-full"
              />
            </div>
            {/* Verified badge */}
            {isVerified && (
              <div 
                className="absolute bottom-1 right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-30"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: '3px solid #0f0f0f' }}
                title="Подтверждённый канал"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">{channel.displayName}</h1>
              {isVerified && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ✓ Подтверждён
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="font-medium text-white">@{channel.displayName.toLowerCase().replace(/\s/g, '')}</span>
              <span>•</span>
              <span>{subscriberCount.toLocaleString()} подписчиков</span>
              <span>•</span>
              <span>{videos.length} видео</span>
            </div>
            
            {/* Description preview */}
            <button
              onClick={() => setShowAboutModal(true)}
              className="mt-3 text-sm text-gray-400 hover:text-white flex items-center gap-1 group max-w-xl"
            >
              <span className="line-clamp-1">{channel.description || 'Нажмите, чтобы узнать больше о канале'}</span>
              <span className="text-gray-500 group-hover:text-white">...ещё</span>
            </button>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <span className="text-lg">👁️</span>
                <span className="text-sm text-white font-medium">{formatViews(totalViews)}</span>
                <span className="text-xs text-gray-500">просмотров</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                <span className="text-lg">❤️</span>
                <span className="text-sm text-white font-medium">{totalLikes}</span>
                <span className="text-xs text-gray-500">лайков</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isOwner ? (
              <>
                <button
                  onClick={handleSubscribe}
                  className={`group relative px-6 py-3 rounded-full font-medium transition-all duration-300 overflow-hidden ${
                    isSubscribed ? '' : 'hover:scale-105'
                  }`}
                  style={{
                    background: isSubscribed 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'linear-gradient(135deg, #ff0000, #cc0000)',
                    boxShadow: isSubscribed ? 'none' : '0 4px 20px rgba(255,0,0,0.4)'
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2 text-white">
                    {isSubscribed ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                        </svg>
                        Вы подписаны
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Подписаться
                      </>
                    )}
                  </span>
                  {!isSubscribed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                </button>
                
                <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors" title="Поделиться">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/upload" 
                  className="group relative px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                    boxShadow: '0 4px 20px rgba(255,0,0,0.4)'
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Загрузить
                  </span>
                </Link>
                <Link 
                  href="/settings" 
                  className="px-5 py-2.5 rounded-full font-medium bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Настройки
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-gray-800 px-4 sm:px-6 sticky top-14 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'videos', label: 'Видео', icon: '🎬', count: videos.length },
            { id: 'playlists', label: 'Плейлисты', icon: '📁', count: playlists.length },
            { id: 'community', label: 'Сообщество', icon: '💬', count: null },
            { id: 'about', label: 'О канале', icon: 'ℹ️', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon} {tab.label}
                {tab.count !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>


      {/* Content */}
      <div className="px-4 sm:px-6 py-6">
        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <>
            {videos.length === 0 ? (
              <div className="text-center py-20">
                <div 
                  className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(255,0,0,0.1), rgba(255,0,0,0.05))' }}
                >
                  <span className="text-6xl">🎬</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isOwner ? 'Загрузите своё первое видео!' : 'Пока нет видео'}
                </h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  {isOwner 
                    ? 'Начните делиться своим контентом с миром. Ваши подписчики ждут!' 
                    : 'На этом канале пока нет видео. Загляните позже!'}
                </p>
                {isOwner && (
                  <Link 
                    href="/upload" 
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                      boxShadow: '0 4px 20px rgba(255,0,0,0.4)'
                    }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-white">Загрузить видео</span>
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Sort Bar */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    {[
                      { id: 'new', label: 'Новые', icon: '🔥', colors: '#ef4444, #f97316' },
                      { id: 'popular', label: 'Популярные', icon: '⚡', colors: '#a855f7, #ec4899' },
                      { id: 'old', label: 'Старые', icon: '⏰', colors: '#3b82f6, #06b6d4' },
                    ].map((sort) => (
                      <button
                        key={sort.id}
                        onClick={() => setSortBy(sort.id as typeof sortBy)}
                        className={`group relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                          sortBy === sort.id ? 'scale-105' : 'hover:scale-105'
                        }`}
                        style={{
                          background: sortBy === sort.id 
                            ? `linear-gradient(135deg, ${sort.colors})` 
                            : 'rgba(255,255,255,0.05)',
                          boxShadow: sortBy === sort.id ? '0 4px 15px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        <span className={`relative z-10 flex items-center gap-2 ${sortBy === sort.id ? 'text-white' : 'text-gray-400'}`}>
                          {sort.icon} {sort.label}
                        </span>
                        {!sortBy && sortBy !== sort.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-2xl">🎬</span>
                    <div>
                      <span className="text-lg font-bold text-white">{videos.length}</span>
                      <span className="text-sm text-gray-400 ml-1">видео</span>
                    </div>
                  </div>
                </div>
                
                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {sortedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      id={video.id}
                      title={video.title}
                      thumbnail={video.thumbnail}
                      authorId={video.authorId}
                      authorName={video.authorName}
                      views={video.views}
                      createdAt={video.createdAt}
                      hideAuthor={true}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}
              >
                <div className="relative aspect-video">
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${playlist.gradient.replace('from-', '').replace('to-', ', ').replace('-500', '')})` }}
                  >
                    <span className="text-6xl opacity-50">{playlist.icon}</span>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-2/5 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-white text-3xl font-bold">{playlist.videoCount}</span>
                      <svg className="w-6 h-6 text-white mx-auto mt-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <svg className="w-7 h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{playlist.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Плейлист • {playlist.videoCount} видео</p>
                </div>
              </div>
            ))}
            
            {/* Create Playlist Button */}
            {isOwner && (
              <div className="rounded-2xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-red-500 transition-all duration-300 cursor-pointer group hover:scale-105">
                <div className="aspect-video flex items-center justify-center bg-white/5 group-hover:bg-red-500/10 transition-colors">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-800 group-hover:bg-red-600/30 flex items-center justify-center transition-colors">
                      <svg className="w-8 h-8 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="mt-4 text-gray-400 group-hover:text-white transition-colors font-medium">Создать плейлист</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))' }}
            >
              <span className="text-5xl">💬</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Сообщество</h3>
            <p className="text-gray-400 mb-6">
              Здесь скоро появятся посты и обсуждения от автора канала
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 text-sm">
              <span>🚀</span> Скоро
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto">
            <div 
              className="rounded-2xl p-8"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}
            >
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📝</span> Описание
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {channel.description || 'Автор пока не добавил описание канала'}
                </p>
              </div>
              
              {/* Stats Grid */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>📊</span> Статистика
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: '👁️', value: formatViews(totalViews), label: 'просмотров', color: 'from-blue-500 to-cyan-500' },
                    { icon: '🎬', value: videos.length, label: 'видео', color: 'from-red-500 to-pink-500' },
                    { icon: '👥', value: subscriberCount.toLocaleString(), label: 'подписчиков', color: 'from-purple-500 to-pink-500' },
                    { icon: '❤️', value: totalLikes, label: 'лайков', color: 'from-pink-500 to-red-500' },
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className="p-4 rounded-xl text-center transition-transform hover:scale-105"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-3xl mb-2 block">{stat.icon}</span>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>ℹ️</span> Информация
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-sm text-gray-400">Дата регистрации</p>
                      <p className="text-white">
                        {new Date(channel.createdAt).toLocaleDateString('ru-RU', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="text-xl">🌍</span>
                    <div>
                      <p className="text-sm text-gray-400">Страна</p>
                      <p className="text-white">Россия</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowAboutModal(false)}>
          <div 
            className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>ℹ️</span> О канале
              </h2>
              <button onClick={() => setShowAboutModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Описание</h3>
                <p className="text-white whitespace-pre-wrap">{channel.description || 'Нет описания'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '👁️', value: formatViews(totalViews), label: 'просмотров' },
                  { icon: '👥', value: subscriberCount.toLocaleString(), label: 'подписчиков' },
                  { icon: '🎬', value: videos.length, label: 'видео' },
                  { icon: '📅', value: new Date(channel.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }), label: 'создан' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 text-center">
                    <span className="text-2xl">{stat.icon}</span>
                    <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
