import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Category, Story, Reel, Wallpaper, Profile, Comment } from './types';
import { cn } from './lib/utils';
import { 
  Upload, 
  Plus, 
  Download, 
  ImageIcon, 
  Trash2, 
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
  Palette,
  User as UserIcon,
  LogOut,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Filter } from 'bad-words';

// Components
import { AuthModal } from './components/AuthModal';
import { CommentSection } from './components/CommentSection';
import { StoryCard } from './components/StoryCard';
import { WallpaperCard } from './components/WallpaperCard';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const filter = new Filter();

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
            <XCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Supabase Not Configured</h1>
            <p className="text-white/40 text-sm">
              Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables in the <strong>Secrets</strong> panel to start using StoryHub.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-2">Required Secrets</h3>
            <ul className="space-y-1 text-xs font-mono text-white/60">
              <li>• VITE_SUPABASE_URL</li>
              <li>• VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers'>('stories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'story' | 'wallpaper'>('story');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'category' | 'story' | 'reel' | 'wallpaper', id: string, extra?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reelInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
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
      fetchProfile(session.user.id);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, storyRes, reelRes, wallRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('stories').select('*, profiles(*)').order('created_at', { ascending: false }),
        supabase.from('reels').select('*, profiles(*)').order('created_at', { ascending: false }),
        supabase.from('wallpapers').select('*, profiles(*)').order('created_at', { ascending: false })
      ]);

      setCategories(catRes.data || []);
      setStories(storyRes.data || []);
      setReels(reelRes.data || []);
      setWallpapers(wallRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (filter.isProfane(text)) {
      setUploadStatus({ type: 'error', message: 'Please avoid using swear words in comments.' });
      return;
    }

    setIsSubmittingComment(true);
    try {
      const { error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, content: text.trim() }]);
      if (error) throw error;
      fetchComments(postId);
    } catch (error: any) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
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
        contents: [{
          parts: [
            { text: "Analyze this image for nudity or sexually explicit content. Reply with 'EXPLICIT' if it contains nudity or sexually explicit content, otherwise reply with 'SAFE'. Only reply with one word." },
            { inlineData: { data: base64Data, mimeType: file.type } }
          ]
        }]
      });

      return response.text?.trim().toUpperCase() === 'EXPLICIT';
    } catch (error) {
      console.error('Error checking nudity:', error);
      return false;
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim(), type: newCategoryType }]);
      if (error) throw error;
      setNewCategoryName('');
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;
    try {
      const { error } = await supabase.from('categories').update({ name: editCategoryName.trim() }).eq('id', editingCategory.id);
      if (error) throw error;
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setShowDeleteModal(null);
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    if (!user) { setIsAuthModalOpen(true); return; }
    setUploading(true);
    try {
      if (await checkNudity(file)) throw new Error('Upload denied: Nudity detected.');
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('story-images').upload(`stories/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('story-images').getPublicUrl(`stories/${fileName}`);
      await supabase.from('stories').insert([{ image_url: publicUrl, category_id: selectedCategory, user_id: user.id, title: uploadTitle, caption: uploadCaption, description: uploadDescription }]);
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    } finally { setUploading(false); }
  };

  const handleReelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { setIsAuthModalOpen(true); return; }
    setUploading(true);
    try {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('story-images').upload(`reels/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('story-images').getPublicUrl(`reels/${fileName}`);
      await supabase.from('reels').insert([{ video_url: publicUrl, user_id: user.id, music_name: 'Original Audio', title: uploadTitle, caption: uploadCaption, description: uploadDescription }]);
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    } finally { setUploading(false); }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    if (!user) { setIsAuthModalOpen(true); return; }
    setUploading(true);
    try {
      if (await checkNudity(file)) throw new Error('Upload denied: Nudity detected.');
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('story-images').upload(`wallpapers/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('story-images').getPublicUrl(`wallpapers/${fileName}`);
      await supabase.from('wallpapers').insert([{ image_url: publicUrl, category_id: selectedCategory, user_id: user.id, title: uploadTitle, caption: uploadCaption, description: uploadDescription }]);
      fetchData();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message });
    } finally { setUploading(false); }
  };

  const downloadImage = async (url: string, name: string, isWallpaper = false) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `storyhub-${name}.${url.split('.').pop()}`;
      link.click();
      if (isWallpaper) {
        const wall = wallpapers.find(w => w.id === name);
        if (wall) await supabase.from('wallpapers').update({ downloads_count: (wall.downloads_count || 0) + 1 }).eq('id', name);
      }
    } catch (error) { console.error(error); }
  };

  const handleLikeWallpaper = async (id: string) => {
    const wall = wallpapers.find(w => w.id === id);
    if (wall) await supabase.from('wallpapers').update({ likes_count: (wall.likes_count || 0) + 1 }).eq('id', id);
    fetchData();
  };

  const handleSocialShare = (platform: 'instagram' | 'facebook', url: string) => {
    const shareUrl = platform === 'instagram' ? `https://www.instagram.com/reels/create/` : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const filteredStories = selectedCategory ? stories.filter(s => s.category_id === selectedCategory) : [
    ...stories.map(s => ({ ...s, isReel: false })),
    ...reels.map(r => ({ id: r.id, image_url: r.video_url, category_id: null, created_at: r.created_at, isReel: true, caption: r.caption, music_name: r.music_name, profiles: r.profiles }))
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const filteredWallpapers = selectedCategory ? wallpapers.filter(w => w.category_id === selectedCategory) : wallpapers;

  const activeCategories = categories.filter(cat => {
    if (activeTab === 'stories') return cat.type === 'story' && stories.some(s => s.category_id === cat.id);
    if (activeTab === 'wallpapers') return cat.type === 'wallpaper' && wallpapers.some(w => w.category_id === cat.id);
    return false;
  });

  const isAdmin = user?.email === 'avstudio1992@gmail.com';

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-orange-500/30">
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-white/60 mb-8">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(null)} className="flex-1 bg-white/5 py-3 rounded-xl font-bold">Cancel</button>
                <button onClick={() => handleDeleteCategory(showDeleteModal.id)} className="flex-1 bg-red-500 py-3 rounded-xl font-bold">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg"><ImageIcon className="text-white w-6 h-6" /></div>
          <h1 className="text-xl font-bold">StoryHub</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-black">@{profile?.username || 'user'}</span>
                <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-white/40 hover:text-rose-500 transition-colors flex items-center gap-1"><LogOut className="w-3 h-3" />Logout</button>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-white/50" />}
              </div>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-2.5 bg-white text-black text-sm font-black rounded-full">Login</button>
          )}
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={fetchData} />

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
          <button onClick={() => setActiveTab('stories')} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'stories' ? "bg-orange-500 text-white shadow-lg" : "text-white/40")}>Stories</button>
          <button onClick={() => setActiveTab('reels')} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'reels' ? "bg-orange-500 text-white shadow-lg" : "text-white/40")}>Reels</button>
          <button onClick={() => setActiveTab('wallpapers')} className={cn("px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2", activeTab === 'wallpapers' ? "bg-orange-500 text-white shadow-lg" : "text-white/40")}>Wallpapers</button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isAdmin ? (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-8">
              <section className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Plus className="w-6 h-6 text-orange-500" />Add Category</h2>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="flex gap-3">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category name" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3" />
                    <button type="submit" className="bg-orange-500 px-6 py-3 rounded-xl font-semibold">Add</button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setNewCategoryType('story')} className={cn("flex-1 py-2 rounded-lg text-xs font-bold border", newCategoryType === 'story' ? "bg-white text-black" : "bg-white/5 text-white/40")}>Story</button>
                    <button type="button" onClick={() => setNewCategoryType('wallpaper')} className={cn("flex-1 py-2 rounded-lg text-xs font-bold border", newCategoryType === 'wallpaper' ? "bg-white text-black" : "bg-white/5 text-white/40")}>Wallpaper</button>
                  </div>
                </form>
              </section>
              <section className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Upload className="w-6 h-6 text-orange-500" />Upload</h2>
                <div className="space-y-4">
                  <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Title" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3" />
                  <select value={selectedCategory || ''} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3">
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 p-4 rounded-xl text-xs">Story</button>
                    <button onClick={() => reelInputRef.current?.click()} className="bg-white/5 p-4 rounded-xl text-xs">Reel</button>
                    <button onClick={() => wallpaperInputRef.current?.click()} className="bg-white/5 p-4 rounded-xl text-xs">Wallpaper</button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <input type="file" ref={reelInputRef} onChange={handleReelUpload} className="hidden" />
                  <input type="file" ref={wallpaperInputRef} onChange={handleWallpaperUpload} className="hidden" />
                </div>
              </section>
            </div>
          </div>
        ) : activeTab === 'stories' ? (
          <div className="space-y-12">
            <div className="flex overflow-x-auto no-scrollbar gap-2">
              <button onClick={() => setSelectedCategory(null)} className={cn("px-6 py-3 rounded-full text-sm font-bold border whitespace-nowrap", !selectedCategory ? "bg-white text-black" : "bg-white/5 text-white/60")}>All</button>
              {activeCategories.map(cat => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn("px-6 py-3 rounded-full text-sm font-bold border whitespace-nowrap", selectedCategory === cat.id ? "bg-white text-black" : "bg-white/5 text-white/60")}>{cat.name}</button>)}
            </div>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
              {filteredStories.map(story => <StoryCard key={story.id} story={story} categories={categories} onClick={setSelectedStory} />)}
            </div>
          </div>
        ) : activeTab === 'wallpapers' ? (
          <div className="space-y-12">
            <div className="flex overflow-x-auto no-scrollbar gap-2">
              <button onClick={() => setSelectedCategory(null)} className={cn("px-6 py-3 rounded-full text-sm font-bold border whitespace-nowrap", !selectedCategory ? "bg-white text-black" : "bg-white/5 text-white/60")}>All</button>
              {activeCategories.map(cat => <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn("px-6 py-3 rounded-full text-sm font-bold border whitespace-nowrap", selectedCategory === cat.id ? "bg-white text-black" : "bg-white/5 text-white/60")}>{cat.name}</button>)}
            </div>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
              {filteredWallpapers.map(wallpaper => <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} categories={categories} onClick={setSelectedWallpaper} />)}
            </div>
          </div>
        ) : (
          <div className="h-[80vh] w-full max-w-md mx-auto relative overflow-hidden rounded-[40px] border-[8px] border-white/10 bg-black">
            <div className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
              {reels.map(reel => (
                <div key={reel.id} className="h-full w-full snap-start relative">
                  <video src={reel.video_url} className="h-full w-full object-cover" loop autoPlay muted playsInline />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 p-6 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">S</div><span className="font-bold">StoryHub</span></div>
                    <p className="text-sm text-white/80">{reel.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto">
            <div className="min-h-screen flex flex-col lg:flex-row">
              <button onClick={() => setSelectedStory(null)} className="fixed top-6 right-6 z-[110] p-3 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              <div className="flex-1 flex items-center justify-center p-6"><img src={selectedStory.image_url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-2xl" /></div>
              <div className="w-full lg:w-[400px] bg-white/5 p-8 space-y-8 overflow-y-auto">
                <h2 className="text-3xl font-black">{selectedStory.title || 'Story Details'}</h2>
                <button onClick={() => downloadImage(selectedStory.image_url, selectedStory.id)} className="w-full bg-white text-black py-5 rounded-2xl font-black flex items-center justify-center gap-3"><Download className="w-6 h-6" />DOWNLOAD</button>
                <CommentSection postId={selectedStory.id} comments={comments} onAddComment={handleAddComment} isSubmitting={isSubmittingComment} />
              </div>
            </div>
          </motion.div>
        )}
        {selectedWallpaper && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl overflow-y-auto">
            <div className="min-h-screen flex flex-col lg:flex-row">
              <button onClick={() => setSelectedWallpaper(null)} className="fixed top-6 right-6 z-[110] p-3 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              <div className="flex-1 flex items-center justify-center p-6"><img src={selectedWallpaper.image_url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-2xl" /></div>
              <div className="w-full lg:w-[400px] bg-white/5 p-8 space-y-8 overflow-y-auto">
                <h2 className="text-3xl font-black">{selectedWallpaper.title || 'Wallpaper Details'}</h2>
                <div className="flex gap-4"><div className="flex-1 bg-white/5 p-4 rounded-2xl text-center"><Heart className="w-6 h-6 text-rose-500 mx-auto mb-1" />{selectedWallpaper.likes_count}</div><div className="flex-1 bg-white/5 p-4 rounded-2xl text-center"><Download className="w-6 h-6 text-blue-500 mx-auto mb-1" />{selectedWallpaper.downloads_count}</div></div>
                <button onClick={() => downloadImage(selectedWallpaper.image_url, selectedWallpaper.id, true)} className="w-full bg-white text-black py-5 rounded-2xl font-black flex items-center justify-center gap-3"><Download className="w-6 h-6" />DOWNLOAD 4K</button>
                <CommentSection postId={selectedWallpaper.id} comments={comments} onAddComment={handleAddComment} isSubmitting={isSubmittingComment} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/10 mt-20 py-12 px-6 text-center opacity-40">
        <p className="text-sm">&copy; 2026 StoryHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
