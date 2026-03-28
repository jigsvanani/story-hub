import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Category, Story, Reel, Wallpaper, Profile, Comment } from './types';
import { UserPanel } from './pages/UserPanel';
import { cn } from './lib/utils';
import { 
  Upload, 
  Plus, 
  Download, 
  Share2, 
  Image as ImageIcon, 
  Trash2, 
  ChevronRight, 
  Settings, 
  Home,
  Loader2,
  CheckCircle2,
  XCircle,
  Instagram,
  Facebook,
  MessageCircle,
  Edit2,
  X,
  Video,
  Music,
  Layers,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Palette,
  User as UserIcon,
  LogOut,
  Mail,
  Lock,
  UserCircle,
  Shield,
  MessageSquare,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Filter } from 'bad-words';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const filter = new Filter();

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: { isOpen: boolean, onClose: () => void, onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Registration
        if (password.length < 8) throw new Error('Password must be at least 8 characters long');
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) throw new Error('Password must contain at least one uppercase letter and one number');

        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (authData.user) {
          let avatarUrl = '';
          if (avatar) {
            const fileExt = avatar.name.split('.').pop();
            const fileName = `${authData.user.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatar);
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
              avatarUrl = urlData.publicUrl;
            }
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, username, avatar_url: avatarUrl }]);
          if (profileError) throw profileError;
        }
      }
      onAuthSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        if (error.message.includes('provider is not enabled')) {
          throw new Error('Google Sign-In is not enabled in your Supabase project. Please go to Authentication -> Providers in your Supabase dashboard and enable Google.');
        }
        throw error;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-white/20 transition-all"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Profile Picture (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-white/20 transition-all"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-white/20 transition-all"
                  placeholder="Enter your password"
                />
              </div>
              {!isLogin && (
                <p className="text-[10px] text-white/30 mt-1 ml-1">
                  Must be 8+ chars, include an uppercase letter and a number.
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-xs text-rose-500">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-4 text-white/30 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>

          <p className="text-center mt-8 text-sm text-white/50">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-white font-black hover:underline"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const CommentSection = ({ postId, comments, onAddComment, isSubmitting }: any) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;
    onAddComment(postId, text);
    setText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          Comments ({comments.length})
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
        />
        <button 
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:scale-100 active:scale-90 shadow-lg shadow-orange-500/20"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
        {comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                {comment.profiles?.avatar_url ? (
                  <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-full h-full p-1.5 text-white/50" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">@{comment.profiles?.username || 'user'}</span>
                  <span className="text-[10px] text-white/20">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6 text-white/10" />
            </div>
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No comments yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StoryCard = ({ story, categories, setSelectedUser }: any) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative break-inside-avoid mb-4 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl cursor-pointer"
      onClick={() => navigate(`/post/${story.isReel ? 'reels' : 'stories'}/${story.id}`)}
    >
      {story.isReel ? (
        <>
          <video 
            ref={videoRef}
            src={story.image_url} 
            className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
            </div>
          </div>
        </>
      ) : (
        <img 
          src={story.image_url} 
          alt="Story" 
          className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      )}

      {story.isReel && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
          <button 
            onClick={toggleMute}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
            <Video className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-3">
        <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">
              {story.isReel ? 'Reel' : (categories.find((c: any) => c.id === story.category_id)?.name || 'Story')}
            </span>
            {story.profiles && (
              <div className="flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); setSelectedUser(story.user_id); }}>
                <div className="w-4 h-4 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {story.profiles.avatar_url ? (
                    <img src={story.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-0.5 text-white/50" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-white/70 hover:text-white transition-colors">@{story.profiles.username}</span>
              </div>
            )}
          </div>
          {story.title && (
            <h3 className="text-sm font-black text-white leading-tight line-clamp-2">{story.title}</h3>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const WallpaperCard = ({ wallpaper, categories, setSelectedUser }: any) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative break-inside-avoid mb-4 rounded-[1.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl cursor-pointer"
      onClick={() => navigate(`/post/wallpapers/${wallpaper.id}`)}
    >
      <img 
        src={wallpaper.image_url} 
        alt="Wallpaper" 
        className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
        {/* Stats on Hover */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <Heart className={cn("w-3.5 h-3.5", isLiked ? "text-rose-500 fill-rose-500" : "text-white")} />
            <span className="text-[10px] font-bold text-white">{wallpaper.likes_count + (isLiked ? 1 : 0)}</span>
          </div>
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-bold text-white">{wallpaper.downloads_count}</span>
          </div>
        </div>

        <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
              {categories.find((c: any) => c.id === wallpaper.category_id)?.name || 'Wallpaper'}
            </span>
            {wallpaper.profiles && (
              <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setSelectedUser(wallpaper.user_id); }}>
                <div className="w-5 h-5 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {wallpaper.profiles.avatar_url ? (
                    <img src={wallpaper.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-1 text-white/50" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-white/70 hover:text-white transition-colors">@{wallpaper.profiles.username}</span>
              </div>
            )}
          </div>
          {wallpaper.title && (
            <h3 className="text-base font-black text-white leading-tight line-clamp-2">{wallpaper.title}</h3>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers'>('stories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'story' | 'wallpaper'>('story');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'category' | 'story' | 'reel' | 'wallpaper', id: string, extra?: string } | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      if (session.user.email === 'jigs.vanani@gmail.com' && window.location.pathname === '/admin') {
        setIsAdmin(true);
      }
      fetchProfile(session.user.id, session.user);
    } else if (window.location.pathname === '/admin') {
      setIsAuthModalOpen(true);
    }
  };

  const fetchProfile = async (userId: string, authUser?: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    } else if (authUser) {
      // Create profile for OAuth users
      const username = authUser.user_metadata?.full_name?.replace(/\s+/g, '').toLowerCase() || 
                       authUser.email?.split('@')[0] || 
                       `user_${Math.random().toString(36).slice(2, 7)}`;
      const avatar_url = authUser.user_metadata?.avatar_url || '';
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ id: userId, username, avatar_url }])
        .select()
        .single();
      
      if (newProfile) setProfile(newProfile);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      setCategories(catData || []);

      const { data: storyData } = await supabase
        .from('stories')
        .select('*, categories(*), profiles(*)')
        .order('created_at', { ascending: false });

      setStories(storyData || []);

      const { data: reelData } = await supabase
        .from('reels')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      setReels(reelData || []);

      const { data: wallData } = await supabase
        .from('wallpapers')
        .select('*, categories(*), profiles(*)')
        .order('created_at', { ascending: false });

      setWallpapers(wallData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email === 'jigs.vanani@gmail.com') {
      fetchAllComments();
      fetchAllUsers();
    }
  }, [user]);

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAllUsers(data);
  };

  const fetchAllComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    if (data) setAllComments(data);
  };

  const deleteCommentAdmin = async (id: string) => {
    if (!confirm('Delete this comment permanentely?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) fetchAllComments();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user and all their content? This cannot be undone.')) return;
    
    // Manual cascading delete
    const tables = ['comments', 'stories', 'reels', 'wallpapers', 'profiles'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq(table === 'profiles' ? 'id' : 'user_id', userId);
      if (error) {
        alert(`Error deleting from ${table}: ` + error.message);
        return;
      }
    }
    
    alert('User and all associated content deleted successfully.');
    fetchAllUsers();
    fetchData(); 
  };

  const handleBlockUser = async (userId: string, hours: number | null) => {
    const blocked_until = hours ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() : null;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_blocked: hours !== 0,
        blocked_until: hours === 0 ? null : blocked_until 
      })
      .eq('id', userId);

    if (error) alert(error.message);
    else {
      fetchAllUsers();
      fetchData();
    }
  };


  const checkNudity = async (file: File): Promise<boolean> => {
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this image for nudity or sexually explicit content. Reply with 'EXPLICIT' if it contains nudity or sexually explicit content, otherwise reply with 'SAFE'. Only reply with one word." },
              { inlineData: { data: base64Data, mimeType: file.type } }
            ]
          }
        ]
      });

      const result = response.text?.trim().toUpperCase();
      return result === 'EXPLICIT';
    } catch (error) {
      console.error('Error checking nudity:', error);
      return false; // Default to safe if check fails, or handle as needed
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim(), type: newCategoryType }]);
      
      if (error) throw error;
      setNewCategoryName('');
      setUploadStatus({ type: 'success', message: 'Category added successfully!' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding category:', error);
      let msg = error.message;
      if (msg.includes('column "type" of relation "categories" does not exist')) {
        msg = "Database error: Please run the SQL script provided in the chat to add the 'type' column to your categories table.";
      }
      setUploadStatus({ type: 'error', message: 'Error adding category: ' + msg });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editCategoryName.trim() })
        .eq('id', editingCategory.id);
      
      if (error) throw error;
      setEditingCategory(null);
      setEditCategoryName('');
      setUploadStatus({ type: 'success', message: 'Category updated successfully!' });
      fetchData();
    } catch (error: any) {
      console.error('Error updating category:', error);
      setUploadStatus({ type: 'error', message: 'Error updating category: ' + error.message });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setShowDeleteModal(null);
      setUploadStatus({ type: 'success', message: 'Category deleted successfully!' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      setUploadStatus({ type: 'error', message: 'Error deleting category: ' + error.message });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) {
      setUploadStatus({ type: 'error', message: 'Please select a category and a file.' });
      return;
    }

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Check if it's a mock category
    if (selectedCategory.startsWith('00000000')) {
      setUploadStatus({ type: 'error', message: 'You cannot upload to a dummy category. Please create a REAL category first in the "Add Category" section.' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      // Nudity check
      const isExplicit = await checkNudity(file);
      if (isExplicit) {
        throw new Error('Upload denied: Nudity or sexually explicit content detected.');
      }

      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('The storage bucket "story-images" was not found. Please create a PUBLIC bucket named "story-images" in your Supabase dashboard.');
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(filePath);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from('stories')
        .insert([{ 
          image_url: publicUrl, 
          category_id: selectedCategory,
          user_id: user.id,
          title: uploadTitle.trim() || null,
          caption: uploadCaption.trim() || null,
          description: uploadDescription.trim() || null
        }]);

      if (dbError) {
        if (dbError.message.includes('new row violates row-level security policy')) {
          throw new Error('Supabase RLS Policy Error: Please enable "Insert" and "Select" policies for authenticated users on your "stories" table in the Supabase dashboard.');
        }
        throw dbError;
      }

      setUploadStatus({ type: 'success', message: 'Story uploaded successfully!' });
      setUploadTitle('');
      setUploadCaption('');
      setUploadDescription('');
      fetchData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error uploading story:', error);
      setUploadStatus({ type: 'error', message: error.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      // Nudity check
      const isExplicit = await checkNudity(file);
      if (isExplicit) {
        throw new Error('Upload denied: Nudity or sexually explicit content detected.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('reels')
        .insert([{ 
          video_url: publicUrl,
          user_id: user.id,
          music_name: 'Original Audio',
          title: uploadTitle.trim() || null,
          caption: uploadCaption.trim() || null,
          description: uploadDescription.trim() || null
        }]);

      if (dbError) throw dbError;

      setUploadStatus({ type: 'success', message: 'Reel uploaded successfully!' });
      setUploadTitle('');
      setUploadCaption('');
      setUploadDescription('');
      fetchData();
      if (reelInputRef.current) reelInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error uploading reel:', error);
      setUploadStatus({ type: 'error', message: error.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) {
      if (!selectedCategory) setUploadStatus({ type: 'error', message: 'Please select a category first.' });
      return;
    }

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      // Nudity check
      const isExplicit = await checkNudity(file);
      if (isExplicit) {
        throw new Error('Upload denied: Nudity or sexually explicit content detected.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `wallpapers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story-images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('wallpapers')
        .insert([{ 
          image_url: publicUrl, 
          category_id: selectedCategory,
          user_id: user.id,
          likes_count: 0,
          downloads_count: 0,
          title: uploadTitle.trim() || null,
          caption: uploadCaption.trim() || null,
          description: uploadDescription.trim() || null
        }]);

      if (dbError) throw dbError;

      setUploadStatus({ type: 'success', message: 'Wallpaper uploaded successfully!' });
      setUploadTitle('');
      setUploadCaption('');
      setUploadDescription('');
      fetchData();
      if (wallpaperInputRef.current) wallpaperInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error uploading wallpaper:', error);
      setUploadStatus({ type: 'error', message: error.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async (id: string, imageUrl: string) => {
    if (id.startsWith('10000000')) {
      setUploadStatus({ type: 'error', message: 'Cannot delete dummy stories.' });
      return;
    }

    try {
      // Only try to delete from storage if it's a real upload (not mock)
      if (!imageUrl.includes('picsum.photos')) {
        const path = imageUrl.split('/').pop();
        if (path) {
          await supabase.storage.from('story-images').remove([`stories/${path}`]);
        }
      }

      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
      setShowDeleteModal(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting story:', error);
      setUploadStatus({ type: 'error', message: 'Error deleting story: ' + error.message });
    }
  };

  const handleDeleteReel = async (id: string, videoUrl: string) => {
    if (id.startsWith('10000000')) {
      setUploadStatus({ type: 'error', message: 'Cannot delete dummy reels.' });
      return;
    }

    try {
      if (!videoUrl.includes('picsum.photos')) {
        const path = videoUrl.split('/').pop();
        if (path) {
          await supabase.storage.from('story-images').remove([`reels/${path}`]);
        }
      }

      const { error } = await supabase.from('reels').delete().eq('id', id);
      if (error) throw error;
      setShowDeleteModal(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting reel:', error);
      setUploadStatus({ type: 'error', message: 'Error deleting reel: ' + error.message });
    }
  };

  const handleDeleteWallpaper = async (id: string, imageUrl: string) => {
    if (id.startsWith('30000000')) {
      setUploadStatus({ type: 'error', message: 'Cannot delete dummy wallpapers.' });
      return;
    }

    try {
      if (!imageUrl.includes('picsum.photos')) {
        const path = imageUrl.split('/').pop();
        if (path) {
          await supabase.storage.from('story-images').remove([`wallpapers/${path}`]);
        }
      }

      const { error } = await supabase.from('wallpapers').delete().eq('id', id);
      if (error) throw error;
      setShowDeleteModal(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting wallpaper:', error);
      setUploadStatus({ type: 'error', message: 'Error deleting wallpaper: ' + error.message });
    }
  };

  const handleSocialShare = (platform: 'instagram' | 'facebook', storyUrl?: string) => {
    const shareUrl = storyUrl || window.location.href;
    const text = encodeURIComponent('Check out this amazing story on StoryHub! 🔥');
    
    if (platform === 'instagram') {
      window.open(`https://www.instagram.com/reels/create/`, '_blank');
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${text}`, '_blank');
    }
  };



  // Filter content based on block status
  const isUserBlocked = (profileId?: string) => {
    if (!profileId) return false;
    const profile = allUsers.find(u => u.id === profileId) || 
                    stories.find(s => s.user_id === profileId)?.profiles ||
                    wallpapers.find(w => w.user_id === profileId)?.profiles ||
                    reels.find(r => r.user_id === profileId)?.profiles;
    
    if (!profile) return false;
    if (profile.is_blocked) {
      if (!profile.blocked_until) return true; // Permanent block
      if (new Date(profile.blocked_until) > new Date()) return true; // Timed block active
    }
    return false;
  };

  const filteredStories = stories.filter(story => {
    if (isUserBlocked(story.user_id)) return false;
    if (selectedCategory && story.category_id !== selectedCategory) return false;
    if (selectedUser && story.user_id !== selectedUser) return false;
    return true;
  });

  const filteredReels = reels.filter(reel => {
    if (isUserBlocked(reel.user_id)) return false;
    if (selectedUser && reel.user_id !== selectedUser) return false;
    return true;
  });

  const filteredWallpapers = wallpapers.filter(wallpaper => {
    if (isUserBlocked(wallpaper.user_id)) return false;
    if (selectedCategory && wallpaper.category_id !== selectedCategory) return false;
    if (selectedUser && wallpaper.user_id !== selectedUser) return false;
    return true;
  });

  const activeCategories = categories.filter(cat => {
    if (activeTab === 'stories') {
      return cat.type === 'story' && stories.some(s => s.category_id === cat.id);
    }
    if (activeTab === 'wallpapers') {
      return cat.type === 'wallpaper' && wallpapers.some(w => w.category_id === cat.id);
    }
    return false;
  });

  const handleAdminToggle = () => {
    if (user?.email === 'jigs.vanani@gmail.com') {
      if (isAdmin) {
        window.location.href = '/';
      } else {
        window.location.href = '/admin';
      }
    } else {
      // For ordinary users, navigate to '/user' panel
      if (!user) {
        setIsAuthModalOpen(true);
      } else {
        if (window.location.pathname === '/user') {
          window.location.href = '/';
        } else {
          window.location.href = '/user';
        }
      }
    }
  };

  if (window.location.pathname === '/user') {
    return (
      <UserPanel 
        user={user} 
        categories={categories}
        stories={stories} 
        reels={reels} 
        wallpapers={wallpapers} 
        fetchData={fetchData} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-orange-500/30">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirm Delete</h2>
                  <p className="text-white/40 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-white/60 mb-8">
                {showDeleteModal.type === 'category' 
                  ? 'Are you sure you want to delete this category? All stories inside it will also be deleted.' 
                  : showDeleteModal.type === 'story'
                  ? 'Are you sure you want to delete this story?'
                  : showDeleteModal.type === 'reel'
                  ? 'Are you sure you want to delete this reel?'
                  : 'Are you sure you want to delete this wallpaper?'}
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (showDeleteModal.type === 'category') {
                      handleDeleteCategory(showDeleteModal.id);
                    } else if (showDeleteModal.type === 'story') {
                      handleDeleteStory(showDeleteModal.id, showDeleteModal.extra || '');
                    } else if (showDeleteModal.type === 'reel') {
                      handleDeleteReel(showDeleteModal.id, showDeleteModal.extra || '');
                    } else {
                      handleDeleteWallpaper(showDeleteModal.id, showDeleteModal.extra || '');
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ImageIcon className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            StoryHub
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">@{profile?.username || 'user'}</span>
                  {user?.email === 'jigs.vanani@gmail.com' && (
                    <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="text-[10px] font-bold text-white/40 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-full h-full p-2 text-white/50" />
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-white text-black text-sm font-black rounded-full hover:bg-zinc-200 transition-all active:scale-95"
            >
              Login
            </button>
          )}
          
          <button 
            onClick={handleAdminToggle}
            className="p-2.5 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={fetchData} 
      />

      {/* Tab Switcher */}
      {!isAdmin && (
        <div className="max-w-7xl mx-auto px-6 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
            <button 
              onClick={() => setActiveTab('stories')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'stories' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/40 hover:text-white"
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Stories
            </button>
            <button 
              onClick={() => setActiveTab('reels')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'reels' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/40 hover:text-white"
              )}
            >
              <Video className="w-4 h-4" />
              Reels
            </button>
            <button 
              onClick={() => setActiveTab('wallpapers')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'wallpapers' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-white/40 hover:text-white"
              )}
            >
              <Palette className="w-4 h-4" />
              Wallpapers
            </button>
          </div>

          {selectedUser && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-2xl"
            >
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                Viewing @{stories.find(s => s.user_id === selectedUser)?.profiles?.username || 
                          wallpapers.find(w => w.user_id === selectedUser)?.profiles?.username || 
                          reels.find(r => r.user_id === selectedUser)?.profiles?.username || 
                          'User'}'s Posts
              </span>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-orange-500/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-orange-500" />
              </button>
            </motion.div>
          )}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isAdmin ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Category Management */}
              <section className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="w-6 h-6 text-orange-500" />
                  Add Category
                </h2>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                    />
                    <button 
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setNewCategoryType('story')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                        newCategoryType === 'story' ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10"
                      )}
                    >
                      Story Category
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewCategoryType('wallpaper')}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold border transition-all",
                        newCategoryType === 'wallpaper' ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10"
                      )}
                    >
                      Wallpaper Category
                    </button>
                  </div>
                </form>

                <div className="mt-8 space-y-3">
                  <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">Existing Categories</h3>
                  <div className="flex flex-col gap-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl group">
                        {editingCategory?.id === cat.id ? (
                          <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                            <input 
                              type="text" 
                              value={editCategoryName}
                              onChange={(e) => setEditCategoryName(e.target.value)}
                              autoFocus
                              className="flex-1 bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <button type="submit" className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingCategory(null)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{cat.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setEditCategoryName(cat.name);
                                }}
                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteModal({ type: 'category', id: cat.id })}
                                className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Upload Section */}
              <section className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-orange-500" />
                  Upload Content
                </h2>

                <div className="space-y-4 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-2">Common Details</h3>
                  <input 
                    type="text" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Title (Optional)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                  <input 
                    type="text" 
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Caption (Optional)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                  />
                  <textarea 
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Description (Optional)"
                    rows={3}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
                  />
                </div>
                
                <div className="space-y-6">
                  {/* Story Upload */}
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-orange-500" />
                      Upload Story (Image)
                    </h3>
                    <div className="space-y-4">
                      <select 
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.type === 'story').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                      >
                        <Upload className="w-6 h-6 text-white/40 group-hover:text-orange-500 transition-colors" />
                        <span className="text-sm font-medium text-white/60">Choose Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Reel Upload */}
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-orange-500" />
                      Upload Reel (Video)
                    </h3>
                    <input 
                      type="file" 
                      accept="video/*"
                      ref={reelInputRef}
                      onChange={handleReelUpload}
                      className="hidden"
                    />
                    <button 
                      onClick={() => reelInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                    >
                      <Upload className="w-6 h-6 text-white/40 group-hover:text-orange-500 transition-colors" />
                      <span className="text-sm font-medium text-white/60">Choose Video</span>
                    </button>
                  </div>

                  {/* Wallpaper Upload */}
                  <div className="p-6 bg-black/40 border border-white/5 rounded-2xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-orange-500" />
                      Upload Wallpaper (Image)
                    </h3>
                    <div className="space-y-4">
                      <select 
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                      >
                        <option value="">Select Category</option>
                        {categories.filter(c => c.type === 'wallpaper').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={wallpaperInputRef}
                        onChange={handleWallpaperUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => wallpaperInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                      >
                        <Upload className="w-6 h-6 text-white/40 group-hover:text-orange-500 transition-colors" />
                        <span className="text-sm font-medium text-white/60">Choose Wallpaper</span>
                      </button>
                    </div>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-6 flex items-center justify-center gap-3 text-orange-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Uploading...</span>
                  </div>
                )}

                {uploadStatus && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "mt-6 p-4 rounded-xl flex items-center gap-3",
                      uploadStatus.type === 'success' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    )}
                  >
                    {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{uploadStatus.message}</span>
                  </motion.div>
                )}
              </section>
            </div>

            {/* Manage Content Section */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Layers className="w-6 h-6 text-orange-500" />
                Manage Content
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Stories List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white/60">
                    <ImageIcon className="w-5 h-5" />
                    Stories ({stories.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {stories.map(story => (
                      <div key={story.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group bg-black/40 border border-white/5">
                        <img src={story.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => setShowDeleteModal({ type: 'story', id: story.id, extra: story.image_url })}
                            className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[10px] font-bold truncate text-white/60">
                            {categories.find(c => c.id === story.category_id)?.name || 'Story'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reels List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white/60">
                    <Video className="w-5 h-5" />
                    Reels ({reels.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {reels.map(reel => (
                      <div key={reel.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group bg-black/40 border border-white/5">
                        <video src={reel.video_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => setShowDeleteModal({ type: 'reel', id: reel.id, extra: reel.video_url })}
                            className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[10px] font-bold truncate text-white/60">
                            {reel.caption || 'Reel'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wallpapers List */}
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-white/60">
                    <Palette className="w-5 h-5" />
                    Wallpapers ({wallpapers.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {wallpapers.map(wallpaper => (
                      <div key={wallpaper.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group bg-black/40 border border-white/5">
                        <img src={wallpaper.image_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => setShowDeleteModal({ type: 'wallpaper', id: wallpaper.id, extra: wallpaper.image_url })}
                            className="p-2 bg-red-500 text-white rounded-xl hover:scale-110 active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[10px] font-bold truncate text-white/60">
                            {categories.find(c => c.id === wallpaper.category_id)?.name || 'Wallpaper'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Manage Comments Section (Admin Only) */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-orange-500" />
                Manage All Comments
              </h2>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">User</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Comment</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Post Info</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allComments.map(comment => {
                        // Find post title/type from state arrays
                        const post = stories.find(s => s.id === comment.post_id) || 
                                     wallpapers.find(w => w.id === comment.post_id) ||
                                     reels.find(r => r.id === comment.post_id);
                        
                        return (
                          <tr key={comment.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                  {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : <UserIcon className="w-full h-full p-1 text-white/40" />}
                                </div>
                                <span className="text-sm font-bold">@{comment.profiles?.username || 'user'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-white/60 line-clamp-2 min-w-[200px]">{comment.content}</p>
                              {comment.parent_id && (
                                <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Reply</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-medium text-white/40">
                                {post ? (post.title || 'Untitled Post') : 'Post not found'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => deleteCommentAdmin(comment.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                title="Delete Comment"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {allComments.length === 0 && (
                  <div className="py-20 text-center text-white/20 font-bold uppercase tracking-widest text-sm">
                    No comments to manage
                  </div>
                )}
              </div>
            </section>

            {/* Manage Users Section (Admin Only) */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-orange-500" />
                  Manage Users
                </h2>
                <span className="bg-white/5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-white/10 text-white/40">
                  {allUsers.length} Total Users
                </span>
              </div>
              
              <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Profile</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Join Date</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers.filter(u => u.username !== 'admin' && u.id !== user?.id).map(u => {
                        const isBlocked = u.is_blocked && (!u.blocked_until || new Date(u.blocked_until) > new Date());
                        
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                                  {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-white/20" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">@{u.username}</p>
                                  <p className="text-[10px] text-white/40">{u.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xs text-white/60">{new Date(u.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                               {isBlocked ? (
                                 <div className="flex flex-col">
                                   <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 w-fit uppercase">Blocked</span>
                                   {u.blocked_until && (
                                     <span className="text-[9px] text-white/20 mt-1">Until: {new Date(u.blocked_until).toLocaleString()}</span>
                                   )}
                                 </div>
                               ) : (
                                 <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 w-fit uppercase">Active</span>
                               )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                               <div className="flex items-center justify-end gap-2">
                                 {isBlocked ? (
                                   <button 
                                      onClick={() => handleBlockUser(u.id, 0)}
                                      className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                                   >
                                     Unblock
                                   </button>
                                 ) : (
                                    <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                                       <button 
                                         onClick={() => handleBlockUser(u.id, 24)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block for 1 Day"
                                       >
                                         1D
                                       </button>
                                       <button 
                                         onClick={() => handleBlockUser(u.id, 48)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block for 2 Days"
                                       >
                                         2D
                                       </button>
                                       <button 
                                         onClick={() => handleBlockUser(u.id, 168)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block for 7 Days"
                                       >
                                         7D
                                       </button>
                                       <button 
                                         onClick={() => handleBlockUser(u.id, 360)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block for 15 Days"
                                       >
                                         15D
                                       </button>
                                       <button 
                                         onClick={() => handleBlockUser(u.id, 720)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block for 30 Days"
                                       >
                                         30D
                                       </button>
                                       <button 
                                         onClick={() => handleBlockUser(u.id, null)}
                                         className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                                         title="Block Permanently"
                                       >
                                         Perm
                                       </button>
                                    </div>
                                 )}
                                 <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                                    title="Delete User"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        ) : activeTab === 'stories' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <header className="text-center space-y-4 py-12">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                ELEVATE YOUR <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-rose-500 to-purple-600">
                  STORY GAME
                </span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto text-lg">
                Premium status and story photos for WhatsApp, Instagram, and Facebook.
              </p>
            </header>

            {/* Category Filter - Horizontal Scrollable */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:justify-center">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap",
                  !selectedCategory 
                    ? "bg-white text-black border-white shadow-xl shadow-white/10" 
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                )}
              >
                All Stories
              </button>
              {activeCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap",
                    selectedCategory === cat.id 
                      ? "bg-white text-black border-white shadow-xl shadow-white/10" 
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Story Grid - Pinterest Style Masonry */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-white/40 font-medium">Curating the best stories...</p>
              </div>
            ) : filteredStories.length > 0 ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
                {filteredStories.map(story => (
                  <StoryCard 
                    key={story.id}
                    story={story}
                    categories={categories}
                    setSelectedUser={setSelectedUser}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold">No stories found</h3>
                <p className="text-white/40">Try selecting a different category or check back later.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'wallpapers' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <header className="text-center space-y-4 py-12">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                PREMIUM <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-600">
                  WALLPAPERS
                </span>
              </h2>
              <p className="text-white/40 max-w-lg mx-auto text-lg">
                Stunning high-quality wallpapers for your mobile device.
              </p>
            </header>

            {/* Category Filter - Horizontal Scrollable */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:justify-center">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap",
                  !selectedCategory 
                    ? "bg-white text-black border-white shadow-xl shadow-white/10" 
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                )}
              >
                All Wallpapers
              </button>
              {activeCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border whitespace-nowrap",
                    selectedCategory === cat.id 
                      ? "bg-white text-black border-white shadow-xl shadow-white/10" 
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Wallpaper Grid - Pinterest Style Masonry */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-white/40 font-medium">Loading wallpapers...</p>
              </div>
            ) : filteredWallpapers.length > 0 ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
                {filteredWallpapers.map(wallpaper => (
                  <WallpaperCard 
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    categories={categories}
                    setSelectedUser={setSelectedUser}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Palette className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-xl font-bold">No wallpapers found</h3>
                <p className="text-white/40">Try selecting a different category or check back later.</p>
              </div>
            )}
          </div>
        ) : (
          /* Reels Viewer */
          <div className="h-[80vh] w-full max-w-md mx-auto relative overflow-hidden rounded-[40px] border-[8px] border-white/10 bg-black shadow-2xl">
            <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
              {reels.map(reel => (
                <div key={reel.id} className="h-full w-full snap-start relative group">
                  <video 
                    src={reel.video_url} 
                    className="h-full w-full object-cover"
                    loop
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* Reel Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 p-6 flex flex-col justify-end">
                    <div className="flex justify-between items-end">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 overflow-hidden">
                            {reel.profiles?.avatar_url ? (
                              <img src={reel.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-full h-full p-2 text-white/50" />
                            )}
                          </div>
                          <span className="font-bold">@{reel.profiles?.username || 'StoryHub'}</span>
                        </div>
                        <p className="text-sm text-white/80">{reel.caption || 'Awesome reel! 🔥'}</p>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Music className="w-3 h-3 animate-spin-slow" />
                          <span>{reel.music_name}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-6 items-center">
                        <button 
                          onClick={() => handleSocialShare('instagram', reel.video_url)}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover/btn:bg-rose-500 transition-colors">
                            <Instagram className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Insta</span>
                        </button>

                        <button 
                          onClick={() => handleSocialShare('facebook', reel.video_url)}
                          className="flex flex-col items-center gap-1 group/btn"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover/btn:bg-blue-500 transition-colors">
                            <Facebook className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">FB</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-40">
          <ImageIcon className="w-5 h-5" />
          <span className="font-bold tracking-tighter">StoryHub</span>
        </div>
        <p className="text-white/20 text-sm">
          &copy; 2026 StoryHub. All rights reserved. <br />
          Made for WhatsApp, Instagram, and Facebook Stories.
        </p>
      </footer>
    </div>
  );
}
