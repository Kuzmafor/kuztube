'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type UploadType = 'video' | 'short';
type UploadMethod = 'file' | 'link';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [uploadType, setUploadType] = useState<UploadType>('video');
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [urlValidated, setUrlValidated] = useState(false);
  const [urlPlatform, setUrlPlatform] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Validate and detect platform from URL
  const validateUrl = (url: string) => {
    setVideoUrl(url);
    setUrlValidated(false);
    setUrlPlatform('');
    
    if (!url) return;

    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    // Rutube pattern
    const rutubePattern = /rutube\.ru\/video\/([a-zA-Z0-9]+)/;
    
    // VK Video pattern
    const vkPattern = /vk\.com\/video(-?\d+_\d+)/;

    for (const pattern of youtubePatterns) {
      if (pattern.test(url)) {
        setUrlValidated(true);
        setUrlPlatform('youtube');
        if (url.includes('/shorts/')) {
          setUploadType('short');
        }
        return;
      }
    }

    if (rutubePattern.test(url)) {
      setUrlValidated(true);
      setUrlPlatform('rutube');
      return;
    }

    if (vkPattern.test(url)) {
      setUrlValidated(true);
      setUrlPlatform('vk');
      return;
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || url.startsWith('http')) {
      setUrlValidated(true);
      setUrlPlatform('direct');
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = uploadType === 'short' ? 100 * 1024 * 1024 : 500 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Файл слишком большой (макс. ${uploadType === 'short' ? '100MB' : '500MB'})`);
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Выберите изображение для превью');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const getEmbedUrl = (url: string): string => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    
    // Rutube
    const rtMatch = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
    if (rtMatch) {
      return `https://rutube.ru/play/embed/${rtMatch[1]}`;
    }
    
    return url;
  };

  const uploadWithProgress = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('videos')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    for (let i = 0; i <= 80; i += 10) {
      setUploadProgress(i);
      await new Promise(r => setTimeout(r, 100));
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title.trim()) {
      setError('Заполните название');
      return;
    }

    if (uploadMethod === 'file' && !videoFile) {
      setError('Выберите видео файл');
      return;
    }

    if (uploadMethod === 'link' && !urlValidated) {
      setError('Введите корректную ссылку на видео');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      let finalVideoUrl = '';
      let thumbnailUrl = '';

      if (uploadMethod === 'file') {
        const videoId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        setUploadStatus('Загрузка видео...');
        const videoPath = `${videoId}/video.mp4`;
        finalVideoUrl = await uploadWithProgress(videoFile!, videoPath);
        
        setUploadProgress(85);
        setUploadStatus('Загрузка превью...');

        if (thumbnailFile) {
          const thumbPath = `${videoId}/thumbnail.jpg`;
          const { error: thumbError } = await supabase.storage
            .from('videos')
            .upload(thumbPath, thumbnailFile, { upsert: true });

          if (!thumbError) {
            const { data: thumbUrlData } = supabase.storage.from('videos').getPublicUrl(thumbPath);
            thumbnailUrl = thumbUrlData.publicUrl;
          }
        }
      } else {
        // Link upload - быстрая обработка
        setUploadStatus('Обработка ссылки...');
        setUploadProgress(50);
        
        finalVideoUrl = getEmbedUrl(videoUrl);
        
        // For YouTube, we can get thumbnail
        const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
          thumbnailUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
        
        setUploadProgress(70);
      }

      setUploadProgress(80);
      setUploadStatus('Сохранение...');

      console.log('Saving video with URL:', finalVideoUrl);

      // Проверяем сессию перед вставкой
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
      }

      const insertData = {
        title: title.trim(),
        description: description.trim(),
        video_url: finalVideoUrl,
        thumbnail: thumbnailUrl || thumbnailPreview || '',
        author_id: session.user.id, // Используем ID из сессии
        author_name: user.displayName || 'Пользователь',
        views: 0,
        likes: 0,
        dislikes: 0,
        is_short: uploadType === 'short',
      };
      
      console.log('Insert data:', insertData);

      const { data: videoDoc, error: dbError } = await supabase
        .from('videos')
        .insert(insertData)
        .select()
        .single();

      console.log('Insert result:', { videoDoc, dbError });

      if (dbError) {
        console.error('DB Error:', dbError);
        throw new Error(dbError.message || 'Ошибка сохранения');
      }

      if (!videoDoc) {
        throw new Error('Видео не сохранено');
      }

      setUploadProgress(100);
      setUploadStatus('Готово! Перенаправление...');
      
      // Показываем успех и перенаправляем
      alert(`Видео "${title}" успешно загружено!`);
      
      if (uploadType === 'short') {
        router.push('/shorts');
      } else {
        router.push(`/watch/${videoDoc.id}`);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err?.message || 'Ошибка загрузки. Попробуйте снова';
      setError(errorMessage);
      setUploading(false);
      setUploadStatus('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Загрузить контент
        </h1>
        <p className="text-gray-400">Поделитесь своим видео с миром</p>
      </div>

      {/* Upload Type Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <button
            onClick={() => { setUploadType('video'); setVideoFile(null); setVideoPreview(''); setVideoUrl(''); }}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              uploadType === 'video'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Видео
          </button>
          <button
            onClick={() => { setUploadType('short'); setVideoFile(null); setVideoPreview(''); setVideoUrl(''); }}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              uploadType === 'short'
                ? 'bg-gradient-to-r from-pink-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Shorts
          </button>
        </div>
      </div>

      {/* Type Description */}
      <div className={`text-center mb-8 p-4 rounded-2xl ${uploadType === 'video' ? 'bg-red-500/10 border border-red-500/20' : 'bg-purple-500/10 border border-purple-500/20'}`}>
        {uploadType === 'video' ? (
          <p className="text-gray-300">
            <span className="text-red-400 font-medium">Видео</span> — стандартный горизонтальный формат, до 500MB
          </p>
        ) : (
          <p className="text-gray-300">
            <span className="text-purple-400 font-medium">Shorts</span> — вертикальное видео до 60 секунд, до 100MB
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {/* Upload Method Selector */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => { setUploadMethod('file'); setVideoUrl(''); setUrlValidated(false); }}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            uploadMethod === 'file'
              ? 'border-red-500 bg-red-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${uploadMethod === 'file' ? 'bg-red-500' : 'bg-white/10'}`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-1">Загрузить файл</h3>
          <p className="text-sm text-gray-400">С вашего устройства</p>
        </button>

        <button
          onClick={() => { setUploadMethod('link'); setVideoFile(null); setVideoPreview(''); }}
          className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
            uploadMethod === 'link'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/30'
          }`}
        >
          <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${uploadMethod === 'link' ? 'bg-blue-500' : 'bg-white/10'}`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-1">По ссылке</h3>
          <p className="text-sm text-gray-400">YouTube, Rutube, VK</p>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        {uploadMethod === 'file' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              {uploadType === 'video' ? '🎬 Видео файл' : '📱 Shorts файл'} *
            </label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  className={`w-full rounded-xl ${uploadType === 'short' ? 'max-h-96 mx-auto' : 'max-h-64'} object-contain bg-black`}
                />
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setVideoPreview(''); }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Видео загружено
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-16 rounded-xl border-2 border-dashed border-white/20 hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300 group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-8 h-8 text-gray-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Нажмите для выбора видео</p>
                  <p className="text-sm text-gray-500">или перетащите файл сюда</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Макс. {uploadType === 'short' ? '100MB' : '500MB'} • MP4, WebM, MOV
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Link Upload Section */}
        {uploadMethod === 'link' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              🔗 Ссылка на видео *
            </label>
            <div className="relative">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => validateUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... или https://rutube.ru/video/..."
                className="w-full px-4 py-4 pr-12 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
              />
              {urlValidated && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Platform Icons */}
            <div className="flex items-center gap-4 mt-4">
              <span className="text-sm text-gray-500">Поддерживаемые платформы:</span>
              <div className="flex items-center gap-3">
                {/* YouTube */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${urlPlatform === 'youtube' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400'}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-xs font-medium">YouTube</span>
                </div>
                {/* Rutube */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${urlPlatform === 'rutube' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                  <span className="text-sm font-bold">R</span>
                  <span className="text-xs font-medium">Rutube</span>
                </div>
                {/* VK */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${urlPlatform === 'vk' ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-gray-400'}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.675 2.853 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                  </svg>
                  <span className="text-xs font-medium">VK</span>
                </div>
              </div>
            </div>

            {urlValidated && urlPlatform && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span className="text-green-400">
                  Ссылка распознана: <span className="font-medium capitalize">{urlPlatform}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Thumbnail Upload */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            🖼️ Превью (необязательно)
          </label>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="hidden"
          />
          <div className="flex items-start gap-4">
            {thumbnailPreview ? (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Превью"
                  className="h-32 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Выбрать изображение
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Рекомендуемый размер: 1280x720 (16:9)
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            ✏️ Название *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors"
            placeholder="Введите название видео"
          />
          <div className="flex justify-end mt-2">
            <span className="text-xs text-gray-500">{title.length}/100</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            📝 Описание
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-4 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-500 outline-none focus:border-red-500 transition-colors resize-none"
            placeholder="Расскажите о вашем видео..."
          />
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">{uploadStatus}</span>
              <span className="text-sm text-gray-400">{uploadProgress}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden bg-black/30">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  uploadType === 'video' 
                    ? 'bg-gradient-to-r from-red-600 to-red-400' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-400'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {uploadProgress === 100 && (
              <div className="flex items-center gap-2 mt-3 text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Загрузка завершена!</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || (uploadMethod === 'file' ? !videoFile : !urlValidated) || !title.trim()}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            uploadType === 'video'
              ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/25'
              : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 shadow-lg shadow-purple-500/25'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Загрузка...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Опубликовать {uploadType === 'video' ? 'видео' : 'Shorts'}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
