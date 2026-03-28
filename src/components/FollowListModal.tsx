import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User as UserIcon, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  currentUserId?: string;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  type,
  currentUserId 
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const isFollowers = type === 'followers';
      const selectColumn = isFollowers ? 'follower_id' : 'following_id';
      const filterColumn = isFollowers ? 'following_id' : 'follower_id';
      
      // Get the list of IDs from the follows table
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select(selectColumn)
        .eq(filterColumn, userId);

      if (followError) throw followError;

      if (followRows && followRows.length > 0) {
        const userIds = followRows.map((row: any) => row[selectColumn]);
        
        // Fetch profiles for these IDs
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profileError) throw profileError;
        setUsers(profileData || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching follow list:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-black text-white capitalize">{type}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${type}...`}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Loading...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div 
                key={user.id}
                onClick={() => {
                  navigate(`/profile/${user.id}`);
                  onClose();
                }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-2 text-white/50" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white group-hover:text-orange-500 transition-colors">@{user.username}</h4>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      Member since {new Date(user.created_at).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <UserIcon className="w-6 h-6 text-white/10" />
              </div>
              <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No users found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
