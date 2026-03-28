import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Story, Reel, Wallpaper, Category } from '../types';
import { ArrowLeft, Upload, Trash2, Image as ImageIcon, Video, Palette, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Filter } from 'bad-words';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const filter = new Filter();

interface UserPanelProps {
  user: { id: string; email: string } | null;
  categories: Category[];
  stories: Story[];
  reels: Reel[];
  wallpapers: Wallpaper[];
  fetchData: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  user,
  categories,
  stories,
  reels,
  wallpapers,
  fetchData,
}) => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [activeTab, setActiveTab] = useState<'stories' | 'reels' | 'wallpapers'>('stories');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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

      // Save to database
      const tableName = type === 'reels' ? 'reels' : type;
      const { error: dbError } = await supabase
        .from(tableName)
        .insert([{
          user_id: user.id,
          [type === 'stories' ? 'image_url' : type === 'reels' ? 'video_url' : 'image_url']: urlData.publicUrl,
          title: uploadTitle.trim() || file.name.split('.')[0],
          caption: uploadCaption.trim() || null,
          description: uploadDescription.trim() || null,
          category_id: (type === 'stories' || type === 'wallpapers') ? selectedCategory : null
        }]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      {/* User Header */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            My Content
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              View Site
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
              disabled={isUploading}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white appearance-none"
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
              disabled={isUploading}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40"
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              disabled={isUploading}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40"
            />
            <textarea
              placeholder="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              disabled={isUploading}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-white/40 min-h-[100px] resize-none"
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
          <div className="flex bg-white/5 p-1 rounded-xl w-fit mb-6 border border-white/10">
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'stories'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Stories ({userStories.length})
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reels'
                  ? 'bg-purple-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Reels ({userReels.length})
            </button>
            <button
              onClick={() => setActiveTab('wallpapers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'wallpapers'
                  ? 'bg-orange-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Wallpapers ({userWallpapers.length})
            </button>
          </div>

          {/* Content Display */}
          {activeTab === 'stories' && renderContentList(userStories, 'stories')}
          {activeTab === 'reels' && renderContentList(userReels, 'reels')}
          {activeTab === 'wallpapers' && renderContentList(userWallpapers, 'wallpapers')}
        </div>
      </div>
    </div>
  );
};