import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Download, Instagram, Facebook, MessageCircle, X, Loader2, 
  User as UserIcon, MessageSquare, Send, Heart, Play, Video, 
  Image as ImageIcon, Palette, Music, Bookmark
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { Category } from '../types';

export const PostDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    initSession();
    
    if (type && id) {
      fetchPostDetails();
      fetchComments();
      fetchSuggestions();
    }
  }, [type, id]);

  useEffect(() => {
    if (user && id) {
      checkIfSaved(id);
    }
  }, [user, id]);

  const fetchPostDetails = async () => {
    setLoading(true);
    let tableName = type;
    if (type !== 'stories' && type !== 'reels' && type !== 'wallpapers') {
      tableName = 'stories'; // fallback
    }

    // Try to fetch with categories if not reels
    const selectQuery = tableName === 'reels' 
      ? '*, profiles(*)' 
      : '*, categories(*), profiles(*)';

    const { data, error } = await supabase
      .from(tableName!)
      .select(selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      setError('Post not found.');
    } else {
      // Check if author is blocked
      const author = (data as any).profiles;
      if (author?.is_blocked) {
        const isCurrentlyBlocked = !author.blocked_until || new Date(author.blocked_until) > new Date();
        if (isCurrentlyBlocked) {
          setError('This content is currently unavailable.');
          setLoading(false);
          return;
        }
      }
      setPost(data);
    }
    setLoading(false);
  };

  const checkIfSaved = async (postId: string) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('saved_content')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId);
      
      setIsSaved(!!data && data.length > 0);
    } catch (err) {
      console.error('Error checking save status:', err);
      setIsSaved(false);
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_content')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', id);
        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from('saved_content')
          .insert([{
            user_id: user.id,
            post_id: id,
            type: type
          }]);
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            setIsSaved(true);
            return;
          }
          throw error;
        }
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error('Error saving post:', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', id)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data);
  };

  const fetchSuggestions = async () => {
    let tableName = type || 'stories';
    if (tableName !== 'stories' && tableName !== 'reels' && tableName !== 'wallpapers') {
      tableName = 'stories';
    }

    const { data } = await supabase
      .from(tableName)
      .select('*, profiles(*)')
      .neq('id', id)
      .limit(12)
      .order('created_at', { ascending: false });
    
    if (data) setSuggestions(data);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) alert(error.message);
    else fetchComments();
  };

  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment.");
      return;
    }
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || isSubmittingComment || !id) return;
    
    setIsSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: id,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId
        }]);

      if (error) throw error;
      if (parentId) {
        setReplyContent('');
        setReplyToId(null);
      } else {
        setNewComment('');
      }
      fetchComments();
    } catch (error: any) {
      alert('Error adding comment: ' + error.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `storyhub_${filename}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      
      if (type === 'wallpapers' && post) {
         await supabase.rpc('increment_downloads', { row_id: id });
         setPost({...post, downloads_count: (post.downloads_count || 0) + 1});
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleLikeWallpaper = async () => {
    if (!user) {
      alert("Please login to like.");
      return;
    }
    if (isLiked) return;
    try {
      setIsLiked(true);
      await supabase.rpc('increment_likes', { row_id: id });
      setPost({...post, likes_count: (post.likes_count || 0) + 1});
    } catch (err) {
      setIsLiked(false);
    }
  };

  const handleSocialShare = (platform: 'instagram' | 'facebook', url: string) => {
    const text = encodeURIComponent('Check out this awesome content on StoryHub!');
    const shareUrl = encodeURIComponent(url);
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard! You can now paste it in Instagram.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
         <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">{error || 'Not found'}</h1>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20">Go Home</button>
      </div>
    );
  }

  const isVideo = type === 'reels' || post.video_url;
  const mediaUrl = post.image_url || post.video_url;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Navbar/Header */}
      <nav className="sticky top-0 z-50 bg-[#0F0F0F]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
         <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition">
           <X className="w-6 h-6" />
         </button>
         <h1 className="font-bold tracking-tight">Post Details</h1>
         <div className="w-10"></div>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:flex-wrap">
        {/* Main Media View */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 min-h-[50vh] lg:min-h-0 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-full max-h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-black"
          >
            {isVideo ? (
               <video 
                 src={mediaUrl} 
                 className="max-w-full max-h-[85vh] object-contain"
                 loop autoPlay controls
               />
            ) : (
               <img 
                 src={mediaUrl} 
                 alt="Detail"
                 className="max-w-full max-h-[85vh] object-contain"
                 referrerPolicy="no-referrer"
               />
            )}
          </motion.div>
        </div>

        {/* Sidebar: Details & Actions */}
        <div className="w-full lg:w-[400px] bg-white/5 border-l border-white/10 p-8 space-y-8 lg:min-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Author Info */}
            {post.profiles && (
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  {post.profiles.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-full h-full p-2 text-white/50" />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-white">@{post.profiles.username}</h4>
                </div>
              </div>
            )}

            <div>
              {post.categories && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-bold uppercase tracking-widest border border-orange-500/20">
                  {post.categories.name}
                </span>
              )}
              <h2 className="text-3xl font-black mt-4 tracking-tight">
                {post.title || (type === 'wallpapers' ? 'Wallpaper' : type === 'reels' ? 'Reel' : 'Story')}
              </h2>
              {post.caption && (
                <p className="text-orange-500 font-bold mt-2">"{post.caption}"</p>
              )}
              {post.description && (
                <p className="text-white/60 mt-4 text-sm leading-relaxed">{post.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {type === 'wallpapers' && (
                <div className="flex gap-3 mb-2">
                  <div className="flex-1 bg-white/5 py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="font-bold">{post.likes_count || 0}</span>
                  </div>
                  <div className="flex-1 bg-white/5 py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10">
                    <Download className="w-4 h-4 text-blue-500" />
                    <span className="font-bold">{post.downloads_count || 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => type === 'wallpapers' ? handleLikeWallpaper() : downloadImage(mediaUrl, post.id)}
                  className="flex-1 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                >
                  {type === 'wallpapers' ? (
                    <>
                      <Heart className={cn("w-5 h-5", isLiked ? "fill-black" : "")} />
                      {isLiked ? 'LIKED' : 'LIKE'}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      DOWNLOAD
                    </>
                  )}
                </button>
                <button 
                  onClick={handleSaveToggle}
                  disabled={isSaving}
                  className={cn(
                    "p-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center border",
                    isSaved 
                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" 
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                  title={isSaved ? "Remove from saved" : "Save to profile"}
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
                  )}
                </button>
              </div>

              {type === 'wallpapers' && (
                <button 
                   onClick={() => downloadImage(mediaUrl, post.id)}
                   className="w-full bg-white/10 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                 >
                   <Download className="w-5 h-5" />
                   DOWNLOAD WALLPAPER
                 </button>
              )}
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => handleSocialShare('instagram', mediaUrl)}
                  className="bg-[#E1306C] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                >
                  <Instagram className="w-4 h-4" />
                  Insta
                </button>
                <button 
                  onClick={() => handleSocialShare('facebook', mediaUrl)}
                  className="bg-[#1877F2] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                >
                  <Facebook className="w-4 h-4" />
                  FB
                </button>
              </div>

              <a 
                href={`https://wa.me/?text=${encodeURIComponent('Check out this post: ' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 mt-2 shadow-lg shadow-[#25D366]/10"
              >
                <MessageCircle className="w-5 h-5" />
                WHATSAPP SHARE
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    Comments ({comments.length})
                  </h3>
                </div>

                <form onSubmit={handleAddComment} className="relative">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm text-white"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:scale-100 active:scale-90"
                  >
                    {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                  {comments.length > 0 ? (
                    comments.filter(c => !c.parent_id).map((comment: any) => {
                      const isOwner = user?.id === post.user_id;
                      const isAdmin = user?.email === 'jigs.vanani@gmail.com';
                      const canDelete = isAdmin || isOwner || user?.id === comment.user_id;
                      const canReply = isOwner || isAdmin;

                      return (
                        <div key={comment.id} className="space-y-4">
                          <div className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                              {comment.profiles?.avatar_url ? (
                                <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="w-full h-full p-1.5 text-white/50" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white">@{comment.profiles?.username || 'user'}</span>
                                  <span className="text-[10px] text-white/20">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {canReply && (
                                    <button 
                                      onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                      className="text-[10px] font-bold text-orange-500 hover:text-orange-400"
                                    >
                                      Reply
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button 
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-[10px] font-bold text-rose-500 hover:text-rose-400"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-white/70 leading-relaxed">{comment.content}</p>

                              {/* Reply Input */}
                              {replyToId === comment.id && (
                                <form onSubmit={(e) => handleAddComment(e, comment.id)} className="mt-3 relative">
                                  <input 
                                    autoFocus
                                    type="text" 
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                  <button 
                                    type="submit"
                                    disabled={!replyContent.trim() || isSubmittingComment}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400 disabled:opacity-50"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>

                          {/* Render Replies */}
                          <div className="ml-10 space-y-4 border-l border-white/5 pl-4">
                            {comments.filter(r => r.parent_id === comment.id).map((reply: any) => (
                              <div key={reply.id} className="flex gap-3 group">
                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                                  {reply.profiles?.avatar_url ? (
                                    <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="w-full h-full p-1 text-white/50" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-black text-white">@{reply.profiles?.username || 'user'}</span>
                                      <span className="text-[9px] text-white/20">{new Date(reply.created_at).toLocaleDateString()}</span>
                                      {reply.user_id === post.user_id && (
                                        <span className="text-[8px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-orange-500/20">Author</span>
                                      )}
                                    </div>
                                    { (isAdmin || isOwner || user?.id === reply.user_id) && (
                                      <button 
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-rose-500 hover:text-rose-400"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-sm text-white/70 leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
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
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 border-t border-white/10">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black flex items-center gap-3">
              {type === 'stories' ? <ImageIcon className="w-6 h-6 text-orange-500" /> : 
               type === 'reels' ? <Video className="w-6 h-6 text-orange-500" /> : 
               <Palette className="w-6 h-6 text-orange-500" />}
              More to Explore
            </h3>
            <p className="text-white/40 text-sm font-medium">Handpicked {type} you might like</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {suggestions.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative aspect-[9/16] rounded-3xl overflow-hidden cursor-pointer bg-white/5 border border-white/10 shadow-xl"
              onClick={() => {
                navigate(`/post/${type}/${item.id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {type === 'reels' || item.video_url ? (
                <div className="w-full h-full relative">
                  <video 
                    src={item.video_url || item.image_url} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              ) : (
                <img 
                  src={item.image_url} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="Suggestion"
                  referrerPolicy="no-referrer"
                />
              )}
              
              {/* Simple Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-[10px] font-black text-white/70 truncate">@{item.profiles?.username || 'user'}</p>
                {item.title && <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>}
              </div>

              {type === 'reels' && (
                <div className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                  <Video className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10 border-dashed">
            <p className="text-white/20 font-bold uppercase tracking-widest text-sm">No more suggestions found</p>
          </div>
        )}
      </div>
    </div>
  );
};
