export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  is_blocked?: boolean;
  blocked_until?: string | null;
  created_at: string;
  followers_count?: number;
  following_count?: number;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'story' | 'wallpaper';
  created_at: string;
}

export interface Story {
  id: string;
  image_url: string;
  category_id: string;
  user_id: string;
  title?: string;
  caption?: string;
  description?: string;
  created_at: string;
  category?: Category;
  profiles?: Profile;
}

export interface Reel {
  id: string;
  video_url: string;
  user_id: string;
  title?: string;
  caption?: string;
  description?: string;
  music_name?: string;
  created_at: string;
  profiles?: Profile;
}

export interface Wallpaper {
  id: string;
  image_url: string;
  category_id: string;
  user_id: string;
  title?: string;
  caption?: string;
  description?: string;
  created_at: string;
  likes_count: number;
  downloads_count: number;
  category?: Category;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface SavedContent {
  id: string;
  user_id: string;
  post_id: string;
  type: 'stories' | 'reels' | 'wallpapers';
  created_at: string;
  stories?: Story;
  reels?: Reel;
  wallpapers?: Wallpaper;
}
