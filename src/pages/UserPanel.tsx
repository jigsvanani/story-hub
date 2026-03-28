import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Story, Reel, Wallpaper, Category, Profile } from '../types';
import { ArrowLeft, Upload, Trash2, Image as ImageIcon, Video, Palette, Loader2, MessageSquare, Send, User as UserIcon, XCircle, Bookmark, Download as DownloadIcon, Settings, Users, Shield, Scissors } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Filter } from 'bad-words';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const filter = new Filter();

interface UserPanelProps {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  categories: Category[];
  stories: Story[];
  reels: Reel[];
  wallpapers: Wallpaper[];
  fetchData: () => void;
  onExit: () => void;
  isAdminMode: boolean;
  allUsers: Profile[];
  allComments: any[];
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newCategoryType: 'story' | 'wallpaper';
  setNewCategoryType: (v: 'story' | 'wallpaper') => void;
  editingCategory: Category | null;
  setEditingCategory: (c: Category | null) => void;
  editCategoryName: string;
  setEditCategoryName: (v: string) => void;
  uploadStatus: { type: 'success' | 'error', message: string } | null;
  handleBlockUser: (id: string, hours: number | null) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleAddCategory: (e: React.FormEvent) => Promise<void>;
  handleUpdateCategory: (e: React.FormEvent) => Promise<void>;
  deleteCommentAdmin: (id: string) => Promise<void>;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  user,
  profile,
  categories,
  stories,
  reels,
  wallpapers,
  fetchData,
  onExit,
  isAdminMode,
  allUsers,
  allComments,
  newCategoryName,
  setNewCategoryName,
  newCategoryType,
  setNewCategoryType,
  editingCategory,
  setEditingCategory,
  editCategoryName,
  setEditCategoryName,
  uploadStatus,
  handleBlockUser,
  handleDeleteUser,
  handleAddCategory,
  handleUpdateCategory,
  deleteCommentAdmin,
}) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers' | 'comments' | 'saved' | 'users' | 'categories' | 'moderation'>('stories');
  const [savedContent, setSavedContent] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Check if user is blocked
  const isBlocked = profile?.is_blocked && (!profile.blocked_until || new Date(profile.blocked_until) > new Date());

  // Filter content to show only user's own uploads
  const userStories = stories.filter(story => story.user_id === user?.id);
  const userReels = reels.filter(reel => reel.user_id === user?.id);
  const userWallpapers = wallpapers.filter(wallpaper => wallpaper.user_id === user?.id);

  const checkContentModeration = async (imageUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const aiResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze this image and determine if it contains nudity, sexual content, or inappropriate material. Respond with only 'UNSAFE' or 'SAFE'." },
              { inlineData: { data: base64.split(',')[1], mimeType: "image/jpeg" } }
            ]
          }
        ]
      });

      const text = aiResponse.text?.trim().toUpperCase() || 'SAFE';
      return text === 'UNSAFE';
    } catch (error) {
      console.error('Moderation check failed:', error);
      return true; // Allow upload if moderation fails
    }
  };

  const handleFileUpload = async (file: File, type: 'stories' | 'reels' | 'wallpapers') => {
    if (!user) return;
    if ((type === 'stories' || type === 'wallpapers') && !selectedCategory) {
      alert(`Please select a category before uploading a ${type.slice(0, -1)}.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress('Checking content...');

    try {
      // Content moderation for images
      if (type === 'stories' || type === 'wallpapers') {
        const isSafe = await checkContentModeration(URL.createObjectURL(file));
        if (!isSafe) {
          alert('This content appears to be inappropriate and cannot be uploaded.');
          return;
        }
      }

      setUploadProgress('Uploading file...');

      // Upload file to Supabase Storage
      const fileName = `${type}/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(fileName);

      setUploadProgress('Saving to database...');

      // Prepare data based on content type
      const insertData: any = {
        user_id: user.id,
      };

      if (type === 'stories') {
        insertData.title = uploadTitle.trim() || file.name.split('.')[0];
        insertData.image_url = urlData.publicUrl;
        insertData.category_id = selectedCategory;
      } else if (type === 'reels') {
        insertData.video_url = urlData.publicUrl;
        insertData.caption = uploadCaption.trim() || uploadTitle.trim() || 'Untitled Reel';
        insertData.music_name = 'Original Audio'; // Default music name
      } else if (type === 'wallpapers') {
        insertData.title = uploadTitle.trim() || file.name.split('.')[0];
        insertData.image_url = urlData.publicUrl;
        insertData.category_id = selectedCategory;
        insertData.description = uploadDescription.trim() || null;
      }

      const { error: dbError } = await supabase
        .from(type === 'reels' ? 'reels' : type)
        .insert([insertData]);

      if (dbError) throw dbError;

      setUploadProgress('Upload complete!');
      setUploadTitle('');
      setUploadCaption('');
      setUploadDescription('');
      setSelectedCategory('');
      fetchData();
      setTimeout(() => setUploadProgress(''), 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchSavedContent = async () => {
    if (!user) return;
    try {
      // 1. Fetch the save associations
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_content')
        .select('*')
        .eq('user_id', user.id);
      
      if (savedError) throw savedError;
      if (!savedItems || savedItems.length === 0) {
        setSavedContent([]);
        return;
      }

      // 2. Separate by type and fetch details from respective tables
      const storiesIds = savedItems.filter(i => i.type === 'stories').map(i => i.post_id);
      const reelsIds = savedItems.filter(i => i.type === 'reels').map(i => i.post_id);
      const wallpapersIds = savedItems.filter(i => i.type === 'wallpapers').map(i => i.post_id);

      const [storiesRes, reelsRes, wallpapersRes] = await Promise.all([
        storiesIds.length > 0 ? supabase.from('stories').select('*').in('id', storiesIds) : Promise.resolve({ data: [] }),
        reelsIds.length > 0 ? supabase.from('reels').select('*').in('id', reelsIds) : Promise.resolve({ data: [] }),
        wallpapersIds.length > 0 ? supabase.from('wallpapers').select('*').in('id', wallpapersIds) : Promise.resolve({ data: [] })
      ]);

      // 3. Map details back to the saved items
      const formattedData = savedItems.map(item => {
        let content = null;
        if (item.type === 'stories') content = (storiesRes.data || []).find(s => s.id === item.post_id);
        if (item.type === 'reels') content = (reelsRes.data || []).find(r => r.id === item.post_id);
        if (item.type === 'wallpapers') content = (wallpapersRes.data || []).find(w => w.id === item.post_id);
        return { ...item, content };
      }).filter(item => item.content); // Only show if original content still exists
      
      setSavedContent(formattedData);
    } catch (error: any) {
      console.error('Error fetching saved content:', error.message);
    }
  };

  const handleRemoveSaved = async (saveId: string) => {
    try {
      const { error } = await supabase
        .from('saved_content')
        .delete()
        .eq('id', saveId);
      if (error) throw error;
      setSavedContent(prev => prev.filter(item => item.id !== saveId));
    } catch (error: any) {
      alert('Error removing saved item: ' + error.message);
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      const extension = url.split('.').pop() || 'file';
      link.download = `storyhub_${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (id: string, type: 'stories' | 'reels' | 'wallpapers') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const tableName = type === 'reels' ? 'reels' : type;
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id); // Ensure user can only delete their own content

      if (error) throw error;

      fetchData();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + error.message);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchUserComments();
    }
  }, [user, stories, reels, wallpapers]);

  const fetchUserComments = async () => {
    if (!user) return;
    const userPostIds = [
      ...stories.filter(s => s.user_id === user.id).map(s => s.id),
      ...reels.filter(r => r.user_id === user.id).map(r => r.id),
      ...wallpapers.filter(w => w.user_id === user.id).map(w => w.id)
    ];

    if (userPostIds.length === 0) {
      setUserComments([]);
      return;
    }

    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .in('post_id', userPostIds)
      .order('created_at', { ascending: false });
    
    if (data) setUserComments(data);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchUserComments();
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string, postId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        }]);

      if (error) throw error;
      setReplyContent('');
      setReplyToId(null);
      fetchUserComments();
    } catch (error: any) {
      alert('Error adding reply: ' + error.message);
    }
  };

  const renderContentList = (content: any[], type: 'stories' | 'reels' | 'wallpapers') => {
    if (content.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-white/40 text-sm">No {type} uploaded yet</p>
          <p className="text-white/20 text-xs mt-1">Upload your first {type.slice(0, -1)} above</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {content.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
            {type === 'reels' ? (
              <video
                src={item.video_url}
                className="w-12 h-12 object-cover rounded-md border border-white/10"
                muted
              />
            ) : (
              <img
                src={item.image_url}
                alt={item.title || 'Content'}
                className="w-12 h-12 object-cover rounded-md border border-white/10"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {item.title || `Untitled ${type.slice(0, -1)}`}
              </p>
              <p className="text-white/40 text-xs">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleDelete(item.id, type)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderCommentsList = () => {
    const parentComments = userComments.filter(c => !c.parent_id);
    if (parentComments.length === 0) {
      return (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
          <MessageSquare className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No comments on your posts yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
        {parentComments.map((comment) => {
          const post = stories.find(s => s.id === comment.post_id) || 
                       reels.find(r => r.id === comment.post_id) || 
                       wallpapers.find(w => w.id === comment.post_id);
          
          const replies = userComments.filter(r => r.parent_id === comment.id);

          return (
            <div key={comment.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : <UserIcon className="w-full h-full p-1.5 text-white/40" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-white">@{comment.profiles?.username || 'user'}</span>
                       <span className="text-[10px] text-white/20">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-white/70">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        On: {post?.title || 'Untitled Post'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Reply"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reply Input */}
              {replyToId === comment.id && (
                <form onSubmit={(e) => handleAddReply(e, comment.id, comment.post_id)} className="ml-11 mt-2 relative">
                  <input 
                    autoFocus
                    type="text" 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-11 space-y-3 pt-2 border-t border-white/5">
                  {replies.map(reply => (
                    <div key={reply.id} className="flex items-start justify-between group">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                          {reply.profiles?.avatar_url ? (
                            <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : <UserIcon className="w-full h-full p-1 text-white/40" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-white">@{reply.profiles?.username || 'user'}</span>
                            <span className="text-[9px] text-white/20">{new Date(reply.created_at).toLocaleDateString()}</span>
                            {reply.user_id === user?.id && <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full font-bold uppercase">You</span>}
                          </div>
                          <p className="text-xs text-white/60">{reply.content}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteComment(reply.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* User Header */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent uppercase tracking-tighter">
              {isAdminMode ? 'Admin Panel' : 'User Panel'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-white/10">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-white/40" />}
              </div>
              <div>
                <p className="text-[10px] font-black text-white">@{profile?.username || 'user'}</p>
                <p className="text-[9px] text-white/40 italic">Member since {profile ? new Date(profile.created_at).toLocaleDateString() : 'recently'}</p>
              </div>
            </div>
            <button
               onClick={onExit}
               className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs font-bold"
             >
               View Site
             </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Blocked User Warning */}
        {isBlocked && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl shadow-rose-500/10">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
               <XCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">Your Account is Blocked</h2>
              <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed">
                Admin Jigs has restricted your access. You can view your current posts and handle comments, but you <span className="text-rose-500 font-bold uppercase">cannot upload</span> new content.
              </p>
              {profile?.blocked_until && (
                <div className="bg-rose-500/10 px-4 py-2 rounded-full w-fit mx-auto border border-rose-500/20 mt-4">
                   <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest">
                      Block Expires: {new Date(profile.blocked_until).toLocaleString()}
                   </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Content
          </h2>

          <div className="space-y-4 mb-6">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isUploading || isBlocked}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>Select Category (for Stories/Wallpapers)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              disabled={isUploading || isBlocked}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              disabled={isUploading || isBlocked}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <textarea
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              disabled={isUploading || isBlocked}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40 min-h-[100px] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stories Upload */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'stories')}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4 text-center hover:bg-blue-500/10 transition-colors">
                <ImageIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-medium">Upload Story</p>
                <p className="text-white/60 text-sm">Image files</p>
              </div>
            </div>

            {/* Reels Upload */}
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'reels')}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center hover:bg-purple-500/10 transition-colors">
                <Video className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-medium">Upload Reel</p>
                <p className="text-white/60 text-sm">Video files</p>
              </div>
            </div>

            {/* Wallpapers Upload */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'wallpapers')}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-4 text-center hover:bg-orange-500/10 transition-colors">
                <Palette className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-white font-medium">Upload Wallpaper</p>
                <p className="text-white/60 text-sm">Image files</p>
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-blue-400">{uploadProgress}</span>
              </div>
            </div>
          )}
        </div>

        {/* My Content Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">My Uploaded Content</h2>

          {/* Tab Navigation */}
           <div className="flex bg-white/5 p-1 rounded-xl w-fit mb-6 border border-white/10 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'stories'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Stories ({userStories.length})
            </button>
            <button
               onClick={() => setActiveTab('reels')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 activeTab === 'reels'
                   ? 'bg-purple-500 text-white'
                   : 'text-white/60 hover:text-white hover:bg-white/5'
               }`}
             >
               Reels ({userReels.length})
             </button>
             <button
               onClick={() => setActiveTab('wallpapers')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 activeTab === 'wallpapers'
                   ? 'bg-orange-500 text-white'
                   : 'text-white/60 hover:text-white hover:bg-white/5'
               }`}
             >
               Wallpapers ({userWallpapers.length})
             </button>
             <button
               onClick={() => setActiveTab('comments')}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 activeTab === 'comments'
                   ? 'bg-emerald-500 text-white'
                   : 'text-white/60 hover:text-white hover:bg-white/5'
               }`}
             >
               My Comments ({userComments.length})
             </button>
             <button
               onClick={() => {
                 setActiveTab('saved');
                 fetchSavedContent();
               }}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                 activeTab === 'saved'
                   ? 'bg-rose-500 text-white'
                   : 'text-white/60 hover:text-white hover:bg-white/5'
               }`}
             >
               Saved ({savedContent.length})
             </button>

             {isAdminMode && (
               <>
                 <div className="w-[1px] bg-white/10 mx-2 self-stretch" />
                 <button
                   onClick={() => setActiveTab('users')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                     activeTab === 'users'
                       ? 'bg-amber-500 text-white'
                       : 'text-white/60 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <Users className="w-4 h-4" />
                   Users ({allUsers.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('categories')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                     activeTab === 'categories'
                       ? 'bg-cyan-500 text-white'
                       : 'text-white/60 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <Settings className="w-4 h-4" />
                   Categories ({categories.length})
                 </button>
                 <button
                   onClick={() => setActiveTab('moderation')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                     activeTab === 'moderation'
                       ? 'bg-red-500 text-white'
                       : 'text-white/60 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   <Shield className="w-4 h-4" />
                   Moderate ({allComments.length})
                 </button>
               </>
             )}
           </div>

          {/* Content Display */}
          {activeTab === 'stories' && renderContentList(userStories, 'stories')}
          {activeTab === 'reels' && renderContentList(userReels, 'reels')}
          {activeTab === 'wallpapers' && renderContentList(userWallpapers, 'wallpapers')}
          {activeTab === 'comments' && renderCommentsList()}
          {activeTab === 'saved' && (
            <div className="space-y-12 py-6">
              {['stories', 'reels', 'wallpapers'].map(type => {
                const items = savedContent.filter(item => item.type === type);
                if (items.length === 0) return null;

                return (
                  <div key={type} className="space-y-6">
                    <h3 className="text-xl font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      {type === 'stories' && <ImageIcon className="w-5 h-5 text-blue-400" />}
                      {type === 'reels' && <Video className="w-5 h-5 text-purple-400" />}
                      {type === 'wallpapers' && <Palette className="w-5 h-5 text-orange-400" />}
                      Saved {type}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {items.map(item => (
                        <div key={item.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group bg-white/5 border border-white/10 shadow-2xl">
                          {item.type === 'reels' ? (
                            <video src={item.content.video_url} className="w-full h-full object-cover" />
                          ) : (
                            <img src={item.content.image_url} alt="" className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px]">
                             <button 
                               onClick={() => downloadFile(item.type === 'reels' ? item.content.video_url : item.content.image_url, item.content.id)}
                               className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                               title="Download"
                             >
                               <DownloadIcon className="w-5 h-5" />
                             </button>
                             <button 
                               onClick={() => handleRemoveSaved(item.id)}
                               className="p-3 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                               title="Remove"
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] font-bold text-white truncate">{item.content.title || item.content.caption || 'Untitled'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {savedContent.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                  <Bookmark className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40 font-bold italic">No saved content in your list yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Panels */}
          {isAdminMode && (
            <>
              {activeTab === 'users' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allUsers.map(u => (
                      <div key={u.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden shrink-0">
                            {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-white/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">@{u.username}</h4>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-tight">Member since {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>
                          {u.is_blocked && (
                            <div className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase tracking-widest">Blocked</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleBlockUser(u.id, u.is_blocked ? 0 : 24)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              u.is_blocked ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-red-500/10 border-red-500 text-red-500"
                            )}
                          >
                            {u.is_blocked ? 'Unblock' : 'Block 24h'}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400">Add New Category</h3>
                    <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category Name"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400/50 outline-none"
                      />
                      <select 
                        value={newCategoryType}
                        onChange={(e) => setNewCategoryType(e.target.value as 'story' | 'wallpaper')}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-400/50 outline-none"
                      >
                        <option value="story">Story</option>
                        <option value="wallpaper">Wallpaper</option>
                      </select>
                      <button type="submit" className="bg-cyan-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-colors">
                        Add
                      </button>
                    </form>
                    {uploadStatus && (
                      <p className={cn("text-xs font-bold", uploadStatus.type === 'success' ? "text-emerald-400" : "text-red-400")}>
                        {uploadStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button 
                             onClick={() => {
                               setEditingCategory(cat);
                               setEditCategoryName(cat.name);
                             }}
                            className="p-1.5 bg-white/10 rounded-lg hover:bg-cyan-500 transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-1">{cat.type}</p>
                        <h4 className="font-bold text-white truncate">{cat.name}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'moderation' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {allComments.map((comment: any) => (
                    <div key={comment.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start justify-between group">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                          {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-white/40" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-white">@{comment.profiles?.username}</span>
                             <span className="text-[10px] text-white/40">{new Date(comment.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-white/80">{comment.content}</p>
                          <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Post ID: {comment.post_id}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteCommentAdmin(comment.id)}
                        className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};