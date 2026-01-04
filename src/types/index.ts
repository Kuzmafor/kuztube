// User document in database
export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  banner: string;
  description?: string;
  subscriberCount: number;
  createdAt: string;
}

// Video document in database
export interface VideoDocument {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  authorId: string;
  authorName: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
}

// Comment document in database
export interface CommentDocument {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isPinned: boolean;
  createdAt: string;
}

// Reaction document in database
export interface ReactionDocument {
  id: string;
  type: 'like' | 'dislike';
}

// Subscription document in database
export interface SubscriptionDocument {
  id: string;
  subscriberId: string;
  channelId: string;
  createdAt: string;
}
