'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/lib/useGamification';

interface LikeDislikeButtonsProps {
  videoId: string;
  likes: number;
  dislikes: number;
}

type ReactionType = 'like' | 'dislike' | null;

export default function LikeDislikeButtons({
  videoId,
  likes: initialLikes,
  dislikes: initialDislikes,
}: LikeDislikeButtonsProps) {
  const { user } = useAuth();
  const { recordLike } = useGamification();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<ReactionType>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUserReaction() {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('reactions')
          .select('type')
          .eq('video_id', videoId)
          .eq('user_id', user.uid)
          .single();

        if (data) {
          setUserReaction(data.type as ReactionType);
        }
      } catch (error) {
        // No reaction found - that's ok
      }
    }

    fetchUserReaction();
  }, [user, videoId]);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user || loading) return;

    setLoading(true);

    try {
      if (userReaction === type) {
        // Remove reaction
        await supabase
          .from('reactions')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', user.uid);

        const newLikes = type === 'like' ? likes - 1 : likes;
        const newDislikes = type === 'dislike' ? dislikes - 1 : dislikes;

        await supabase
          .from('videos')
          .update({ likes: newLikes, dislikes: newDislikes })
          .eq('id', videoId);

        if (type === 'like') setLikes(prev => prev - 1);
        else setDislikes(prev => prev - 1);

        setUserReaction(null);
      } else if (userReaction === null) {
        // Add new reaction
        await supabase
          .from('reactions')
          .insert({ video_id: videoId, user_id: user.uid, type });

        const newLikes = type === 'like' ? likes + 1 : likes;
        const newDislikes = type === 'dislike' ? dislikes + 1 : dislikes;

        await supabase
          .from('videos')
          .update({ likes: newLikes, dislikes: newDislikes })
          .eq('id', videoId);

        if (type === 'like') {
          setLikes(prev => prev + 1);
          recordLike();
        } else {
          setDislikes(prev => prev + 1);
        }

        setUserReaction(type);
      } else {
        // Switch reaction
        await supabase
          .from('reactions')
          .update({ type })
          .eq('video_id', videoId)
          .eq('user_id', user.uid);

        const newLikes = type === 'like' ? likes + 1 : likes - 1;
        const newDislikes = type === 'dislike' ? dislikes + 1 : dislikes - 1;

        await supabase
          .from('videos')
          .update({ likes: newLikes, dislikes: newDislikes })
          .eq('id', videoId);

        if (type === 'like') {
          setLikes(prev => prev + 1);
          setDislikes(prev => prev - 1);
        } else {
          setLikes(prev => prev - 1);
          setDislikes(prev => prev + 1);
        }

        setUserReaction(type);
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center rounded-full overflow-hidden"
      style={{ backgroundColor: 'var(--background-secondary)' }}
    >
      <button
        onClick={() => handleReaction('like')}
        disabled={!user || loading}
        className={`flex items-center gap-2 px-4 py-2 transition-colors ${
          userReaction === 'like' ? 'text-blue-500' : ''
        } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
        style={{ color: userReaction === 'like' ? undefined : 'var(--text-primary)' }}
        title={!user ? 'Войдите, чтобы оценить' : 'Нравится'}
      >
        <svg
          className="w-5 h-5"
          fill={userReaction === 'like' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span>{likes}</span>
      </button>

      <div className="w-px h-6" style={{ backgroundColor: 'var(--border-color)' }} />

      <button
        onClick={() => handleReaction('dislike')}
        disabled={!user || loading}
        className={`flex items-center gap-2 px-4 py-2 transition-colors ${
          userReaction === 'dislike' ? 'text-blue-500' : ''
        } ${!user ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}`}
        style={{ color: userReaction === 'dislike' ? undefined : 'var(--text-primary)' }}
        title={!user ? 'Войдите, чтобы оценить' : 'Не нравится'}
      >
        <svg
          className="w-5 h-5"
          fill={userReaction === 'dislike' ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span>{dislikes}</span>
      </button>
    </div>
  );
}
