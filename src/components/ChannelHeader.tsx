'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ChannelHeaderProps {
  channelId: string;
  banner: string;
  avatar: string;
  name: string;
  description?: string;
  subscriberCount: number;
  isOwner: boolean;
  isSubscribed: boolean;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  onDescriptionUpdate?: (description: string) => void;
}

export default function ChannelHeader({
  channelId,
  banner,
  avatar,
  name,
  description,
  subscriberCount,
  isOwner,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  onDescriptionUpdate,
}: ChannelHeaderProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(banner);
  const [currentAvatar, setCurrentAvatar] = useState(avatar);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || '');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleSaveDescription = async () => {
    try {
      const { error } = await supabase.from('users').update({ description: editedDescription }).eq('id', channelId);
      if (error) throw error;
      onDescriptionUpdate?.(editedDescription);
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;
    setUploading(true);
    try {
      const fileName = `${channelId}-banner.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(`banners/${fileName}`, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(`banners/${fileName}`);
      await supabase.from('users').update({ banner: publicUrl }).eq('id', channelId);
      setCurrentBanner(publicUrl + '?t=' + Date.now());
    } catch (error) {
      console.error('Error uploading banner:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;
    setUploading(true);
    try {
      const fileName = `${channelId}-avatar.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(`avatars/${fileName}`, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(`avatars/${fileName}`);
      await supabase.from('users').update({ avatar: publicUrl }).eq('id', channelId);
      setCurrentAvatar(publicUrl + '?t=' + Date.now());
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Wide Banner - Full Width */}
      <div className="relative w-full h-40 sm:h-52 md:h-64 lg:h-72 -mx-4 px-0" style={{ width: 'calc(100% + 2rem)' }}>
        <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: 'var(--background-secondary)' }}>
          {currentBanner ? (
            <img
              src={currentBanner}
              alt="Баннер канала"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-red-900/30 via-red-800/20 to-red-900/30">
              <span style={{ color: 'var(--text-secondary)' }} className="text-lg">Баннер канала</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
        
        {isOwner && (
          <>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-4 right-4 px-4 py-2 rounded-lg bg-black/70 text-white text-sm hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uploading ? 'Загрузка...' : 'Изменить баннер'}
            </button>
          </>
        )}
      </div>

      {/* Channel Info - Overlapping Avatar */}
      <div className="relative -mt-16 sm:-mt-20 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-black shadow-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              {currentAvatar ? (
                <img src={currentAvatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white" style={{ backgroundColor: 'var(--kuztube-red)' }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {isOwner && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 border-2 border-black"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Name, Stats and Subscribe */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span style={{ color: 'var(--text-secondary)' }}>{subscriberCount.toLocaleString()} подписчиков</span>
              </div>
            </div>

            {!isOwner && (
              <button
                onClick={isSubscribed ? onUnsubscribe : onSubscribe}
                className={`px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 ${
                  isSubscribed
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSubscribed ? 'Вы подписаны' : 'Подписаться'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="mt-6 px-4 sm:px-6">
        {isOwner ? (
          isEditingDescription ? (
            <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Расскажите о своём канале..."
                className="w-full p-3 rounded-lg resize-none outline-none focus:ring-2 focus:ring-red-500"
                style={{ backgroundColor: 'var(--background-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                rows={4}
                maxLength={1000}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveDescription} className="px-5 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium">
                  Сохранить
                </button>
                <button
                  onClick={() => { setIsEditingDescription(false); setEditedDescription(description || ''); }}
                  className="px-5 py-2 rounded-full hover:bg-white/10 transition-colors text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
              style={{ backgroundColor: description ? 'transparent' : 'var(--background-secondary)' }}
              onClick={() => setIsEditingDescription(true)}
            >
              {description ? (
                <p style={{ color: 'var(--text-secondary)' }} className="whitespace-pre-wrap">{description}</p>
              ) : (
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Добавить описание канала</span>
                </div>
              )}
            </div>
          )
        ) : description ? (
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <p className={`whitespace-pre-wrap ${!showFullDescription ? 'line-clamp-3' : ''}`} style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
            {description.length > 150 && (
              <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-sm mt-2 font-medium text-red-500 hover:text-red-400">
                {showFullDescription ? 'Свернуть' : 'Показать больше'}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex gap-6 px-4 sm:px-6">
          <button className="pb-3 text-sm font-medium border-b-2 border-red-500 text-white">Видео</button>
          <button className="pb-3 text-sm font-medium border-b-2 border-transparent hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>Плейлисты</button>
          <button className="pb-3 text-sm font-medium border-b-2 border-transparent hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>О канале</button>
        </div>
      </div>
    </div>
  );
}
