'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface VideoType {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail: string;
  author_id: string;
  author_name: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
}

interface CommentType {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
}

export default function Page() {
  const params = useParams();
  const videoId = params.videoId as string;
  const { user } = useAuth();
  
  const [video, setVideo] = useState<VideoType | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([]);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    
    const loadData = async () => {
      const { data } = await supabase.from('videos').select('*').eq('id', videoId).single();
      if (data) {
        setVideo(data);
        setLikes(data.likes || 0);
        setDislikes(data.dislikes || 0);
        await supabase.from('videos').update({ views: (data.views || 0) + 1 }).eq('id', videoId);
        
        const { data: rel } = await supabase.from('videos').select('*').neq('id', videoId).limit(8);
        if (rel) setRelatedVideos(rel);
      }
      
      const saved = localStorage.getItem(`comments-${videoId}`);
      if (saved) setComments(JSON.parse(saved));
      
      if (user) {
        const r = localStorage.getItem(`reaction-${videoId}-${user.uid}`);
        if (r) setUserReaction(r as 'like' | 'dislike');
      }
      setLoading(false);
    };
    
    loadData();
  }, [videoId, user]);

  const fmtViews = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)} млн` : n >= 1e3 ? `${(n/1e3).toFixed(1)} тыс.` : String(n);
  
  const fmtDate = (d: string) => {
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return `${Math.floor(days/30)} мес. назад`;
  };

  const react = async (type: 'like' | 'dislike') => {
    if (!user || !video) return;
    let l = likes, d = dislikes;
    if (userReaction === type) {
      type === 'like' ? l-- : d--;
      setUserReaction(null);
      localStorage.removeItem(`reaction-${videoId}-${user.uid}`);
    } else {
      if (userReaction === 'like') l--;
      if (userReaction === 'dislike') d--;
      type === 'like' ? l++ : d++;
      setUserReaction(type);
      localStorage.setItem(`reaction-${videoId}-${user.uid}`, type);
    }
    setLikes(l); setDislikes(d);
    await supabase.from('videos').update({ likes: l, dislikes: d }).eq('id', videoId);
  };

  const addComment = () => {
    if (!user || !newComment.trim()) return;
    const c: CommentType = { id: String(Date.now()), text: newComment.trim(), author_id: user.uid, author_name: user.displayName || 'User', is_pinned: false, created_at: new Date().toISOString() };
    const upd = [c, ...comments];
    setComments(upd);
    localStorage.setItem(`comments-${videoId}`, JSON.stringify(upd));
    setNewComment('');
  };

  const delComment = (id: string) => {
    const upd = comments.filter(c => c.id !== id);
    setComments(upd);
    localStorage.setItem(`comments-${videoId}`, JSON.stringify(upd));
  };

  const pinComment = (id: string) => {
    const upd = comments.map(c => c.id === id ? {...c, is_pinned: !c.is_pinned} : c).sort((a,b) => (b.is_pinned?1:0)-(a.is_pinned?1:0));
    setComments(upd);
    localStorage.setItem(`comments-${videoId}`, JSON.stringify(upd));
  };

  const isEmbed = video?.video_url?.includes('youtube.com/embed') || video?.video_url?.includes('rutube.ru');
  const isOwner = user?.uid === video?.author_id;

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><div className="w-10 h-10 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin"/></div>;
  
  if (!video) return <div className="flex flex-col items-center justify-center h-[60vh]"><p className="text-xl text-white mb-4">Видео не найдено</p><Link href="/" className="text-blue-500">На главную</Link></div>;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto">
        <div className="flex-1 min-w-0">
          <div className="w-full bg-black rounded-xl overflow-hidden aspect-video">
            {isEmbed ? <iframe src={video.video_url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/> : <video src={video.video_url} poster={video.thumbnail} controls autoPlay className="w-full h-full"/>}
          </div>

          <h1 className="text-xl font-bold text-white mt-4">{video.title}</h1>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Link href={`/channel/${video.author_id}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">{video.author_name[0]?.toUpperCase()}</div>
              </Link>
              <div>
                <Link href={`/channel/${video.author_id}`} className="text-white font-medium hover:text-gray-300">{video.author_name}</Link>
                <p className="text-gray-400 text-sm">{fmtViews(video.views)} просмотров • {fmtDate(video.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 rounded-full">
                <button onClick={() => react('like')} disabled={!user} className={`flex items-center gap-2 px-4 py-2 rounded-l-full hover:bg-white/20 ${userReaction === 'like' ? 'text-blue-400' : 'text-white'}`}>
                  <svg className="w-5 h-5" fill={userReaction === 'like' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                  <span>{fmtViews(likes)}</span>
                </button>
                <div className="w-px bg-white/20"/>
                <button onClick={() => react('dislike')} disabled={!user} className={`flex items-center gap-2 px-4 py-2 rounded-r-full hover:bg-white/20 ${userReaction === 'dislike' ? 'text-blue-400' : 'text-white'}`}>
                  <svg className="w-5 h-5 rotate-180" fill={userReaction === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                  {dislikes > 0 && <span>{fmtViews(dislikes)}</span>}
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Поделиться
              </button>
            </div>
          </div>

          <div className="mt-3 p-3 bg-white/5 rounded-xl cursor-pointer" onClick={() => setShowDesc(!showDesc)}>
            <p className={`text-gray-300 text-sm whitespace-pre-wrap ${!showDesc && 'line-clamp-2'}`}>{video.description || 'Нет описания'}</p>
            {video.description && video.description.length > 100 && <span className="text-gray-500 text-sm">{showDesc ? 'Свернуть' : 'Ещё'}</span>}
          </div>

          <div className="mt-6">
            <h3 className="text-white font-medium mb-4">{comments.length} комментариев</h3>
            
            {user ? (
              <div className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">{(user.displayName || 'U')[0].toUpperCase()}</div>
                <div className="flex-1">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Написать комментарий..." className="w-full bg-transparent border-b border-gray-600 pb-2 text-white outline-none focus:border-blue-500"/>
                  {newComment.trim() && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setNewComment('')} className="px-4 py-1.5 text-gray-400 hover:bg-white/10 rounded-full">Отмена</button>
                      <button onClick={addComment} className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700">Отправить</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 mb-6"><Link href="/login" className="text-blue-500 hover:underline">Войдите</Link>, чтобы комментировать</p>
            )}

            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold flex-shrink-0">{c.author_name[0].toUpperCase()}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.is_pinned && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">📌 Закреплён</span>}
                      <span className="text-white font-medium text-sm">{c.author_name}</span>
                      <span className="text-gray-500 text-xs">{fmtDate(c.created_at)}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{c.text}</p>
                    {(isOwner || c.author_id === user?.uid) && (
                      <div className="flex gap-3 mt-2">
                        {isOwner && <button onClick={() => pinComment(c.id)} className="text-xs text-gray-400 hover:text-white">{c.is_pinned ? 'Открепить' : 'Закрепить'}</button>}
                        <button onClick={() => delComment(c.id)} className="text-xs text-red-400 hover:text-red-300">Удалить</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-gray-500 text-center py-6">Комментариев пока нет</p>}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[400px] flex-shrink-0">
          <h3 className="text-white font-medium mb-3">Рекомендации</h3>
          <div className="space-y-3">
            {relatedVideos.map(v => (
              <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 group">
                <div className="w-40 aspect-video rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                  {v.thumbnail ? <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition"/> : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium line-clamp-2">{v.title}</h4>
                  <p className="text-gray-400 text-xs mt-1">{v.author_name}</p>
                  <p className="text-gray-500 text-xs">{fmtViews(v.views)} • {fmtDate(v.created_at)}</p>
                </div>
              </Link>
            ))}
            {relatedVideos.length === 0 && <p className="text-gray-500">Нет рекомендаций</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
