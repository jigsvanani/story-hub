export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
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
  created_at: string;
  profiles?: Profile;
}
