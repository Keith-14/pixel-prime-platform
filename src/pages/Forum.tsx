import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Plus, Send, ArrowLeft, Loader2, Trash2, Heart, RefreshCw, Sparkles, Users, TrendingUp, Hash, AtSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Post categories
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'general', label: 'General', icon: MessageCircle },
  { id: 'dua', label: 'Dua Requests', icon: Heart },
  { id: 'knowledge', label: 'Knowledge', icon: Hash },
  { id: 'advice', label: 'Advice', icon: Users },
  { id: 'inspiration', label: 'Inspiration', icon: TrendingUp },
];

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Like {
  id: string;
  post_id: string;
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  category?: string;
  replies?: Reply[];
  likes?: Like[];
  likeCount?: number;
  isLiked?: boolean;
}

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Avatar gradient colors based on first letter
const getAvatarGradient = (name: string) => {
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-primary to-amber-500',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-orange-500 to-red-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Helper function to render content with @mentions highlighted
const renderContentWithMentions = (content: string) => {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return parts.map((part, index) => {
    // Every odd index is a captured username
    if (index % 2 === 1) {
      return (
        <span key={index} className="text-primary font-semibold hover:underline cursor-pointer">
          @{part}
        </span>
      );
    }
    return part;
  });
};

export const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const [allUserNames, setAllUserNames] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionTarget, setMentionTarget] = useState<'post' | 'reply'>('post');
  const [profileName, setProfileName] = useState<string | null>(null);
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const PULL_THRESHOLD = 80;

  // Fetch user's profile name from Supabase
  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user?.uid) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.uid)
        .maybeSingle();
      
      if (data?.full_name) {
        setProfileName(data.full_name);
      }
    };
    
    fetchProfileName();
  }, [user?.uid]);

  const currentUserName = profileName || user?.displayName || user?.email?.split('@')[0] || 'User';

  // Get filtered posts based on selected category
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  // Fetch posts with their replies and likes
  const fetchPosts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('guftagu_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch all replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('guftagu_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Fetch all likes
      const { data: likesData, error: likesError } = await supabase
        .from('guftagu_likes')
        .select('*');

      if (likesError) throw likesError;

      // Group replies by post_id
      const repliesByPost: Record<string, Reply[]> = {};
      (repliesData || []).forEach((reply) => {
        if (!repliesByPost[reply.post_id]) {
          repliesByPost[reply.post_id] = [];
        }
        repliesByPost[reply.post_id].push(reply);
      });

      // Group likes by post_id
      const likesByPost: Record<string, Like[]> = {};
      (likesData || []).forEach((like) => {
        if (!likesByPost[like.post_id]) {
          likesByPost[like.post_id] = [];
        }
        likesByPost[like.post_id].push(like);
      });

      // Attach replies and likes to posts
      const postsWithData = (postsData || []).map((post) => {
        const postLikes = likesByPost[post.id] || [];
        return {
          ...post,
          replies: repliesByPost[post.id] || [],
          likes: postLikes,
          likeCount: postLikes.length,
          isLiked: user ? postLikes.some(like => like.user_id === user.uid) : false,
        };
      });

      setPosts(postsWithData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Pull to refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startYRef.current) * 0.5);
    setPullDistance(Math.min(distance, PULL_THRESHOLD * 1.5));
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      fetchPosts(false);
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance, refreshing, fetchPosts]);

  // Fetch all unique usernames for mentions
  const fetchUserNames = useCallback(async () => {
    try {
      const { data: postsData } = await supabase
        .from('guftagu_posts')
        .select('user_name');
      
      const { data: repliesData } = await supabase
        .from('guftagu_replies')
        .select('user_name');

      const allNames = new Set<string>();
      postsData?.forEach(p => allNames.add(p.user_name));
      repliesData?.forEach(r => allNames.add(r.user_name));
      
      setAllUserNames(Array.from(allNames));
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    fetchPosts();
    fetchUserNames();

    // Subscribe to new posts
    const postsChannel = supabase
      .channel('guftagu-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guftagu_posts' },
        (payload) => {
          const newPost = { ...payload.new as Post, replies: [], likes: [], likeCount: 0, isLiked: false };
          setPosts((prev) => [newPost, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'guftagu_posts' },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscribe to likes
    const likesChannel = supabase
      .channel('guftagu-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guftagu_likes' },
        () => {
          // Refetch to update like counts
          fetchPosts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [fetchPosts, fetchUserNames]);

  // Handle mention input
  const handleContentChange = (value: string, target: 'post' | 'reply') => {
    if (target === 'post') {
      setNewPostContent(value);
    } else {
      setNewReply(value);
    }
    
    // Check for @mention trigger
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      const hasSpaceAfter = textAfterAt.includes(' ');
      
      if (!hasSpaceAfter && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentionSuggestions(true);
        setMentionTarget(target);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  const insertMention = (username: string) => {
    const currentContent = mentionTarget === 'post' ? newPostContent : newReply;
    const lastAtIndex = currentContent.lastIndexOf('@');
    const newContent = currentContent.slice(0, lastAtIndex) + '@' + username + ' ';
    
    if (mentionTarget === 'post') {
      setNewPostContent(newContent);
    } else {
      setNewReply(newContent);
    }
    setShowMentionSuggestions(false);
  };

  const filteredSuggestions = allUserNames
    .filter(name => name.toLowerCase().includes(mentionSearch) && name !== currentUserName)
    .slice(0, 5);

  // Subscribe to replies when a post is selected
  useEffect(() => {
    if (!selectedPost) return;

    // Get current replies from posts state
    const currentPost = posts.find(p => p.id === selectedPost.id);
    if (currentPost && currentPost.replies) {
      setSelectedPost(prev => prev ? { ...prev, replies: currentPost.replies, likeCount: currentPost.likeCount, isLiked: currentPost.isLiked } : null);
    }

    const repliesChannel = supabase
      .channel(`guftagu-replies-${selectedPost.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guftagu_replies', filter: `post_id=eq.${selectedPost.id}` },
        (payload) => {
          const newReplyData = payload.new as Reply;
          setSelectedPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              replies: [...(prev.replies || []), newReplyData]
            };
          });
          // Also update posts state
          setPosts((prev) => prev.map(p => 
            p.id === selectedPost.id 
              ? { ...p, replies: [...(p.replies || []), newReplyData] }
              : p
          ));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'guftagu_replies', filter: `post_id=eq.${selectedPost.id}` },
        (payload) => {
          setSelectedPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              replies: (prev.replies || []).filter((r) => r.id !== payload.old.id)
            };
          });
          // Also update posts state
          setPosts((prev) => prev.map(p => 
            p.id === selectedPost.id 
              ? { ...p, replies: (p.replies || []).filter((r) => r.id !== payload.old.id) }
              : p
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(repliesChannel);
    };
  }, [selectedPost?.id, posts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('guftagu_posts').insert({
        user_id: user.uid,
        user_name: currentUserName,
        content: newPostContent.trim(),
        category: newPostCategory,
      });

      if (error) throw error;

      setNewPostContent('');
      setNewPostCategory('general');
      setIsCreateDialogOpen(false);
      toast.success('Post shared!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('guftagu_posts').delete().eq('id', postId);
      if (error) throw error;
      toast.success('Post deleted');
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleToggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    if (likingPosts.has(postId)) return;

    setLikingPosts(prev => new Set(prev).add(postId));

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !isCurrentlyLiked,
          likeCount: isCurrentlyLiked ? (p.likeCount || 1) - 1 : (p.likeCount || 0) + 1
        };
      }
      return p;
    }));

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('guftagu_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.uid);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guftagu_likes')
          .insert({ post_id: postId, user_id: user.uid });
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: isCurrentlyLiked,
            likeCount: isCurrentlyLiked ? (p.likeCount || 0) + 1 : (p.likeCount || 1) - 1
          };
        }
        return p;
      }));
      toast.error('Failed to update like');
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleAddReply = async () => {
    if (!newReply.trim() || !user || !selectedPost) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('guftagu_replies').insert({
        post_id: selectedPost.id,
        user_id: user.uid,
        user_name: currentUserName,
        content: newReply.trim(),
      });

      if (error) throw error;

      setNewReply('');
      toast.success('Reply sent!');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const { error } = await supabase.from('guftagu_replies').delete().eq('id', replyId);
      if (error) throw error;
      toast.success('Reply deleted');
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  // Calculate stats
  const totalLikes = posts.reduce((acc, p) => acc + (p.likeCount || 0), 0);
  const totalReplies = posts.reduce((acc, p) => acc + (p.replies?.length || 0), 0);

  const PostCard = ({ post, showActions = true, index = 0 }: { post: Post; showActions?: boolean; index?: number }) => {
    const isOwner = user?.uid === post.user_id;
    const isLiking = likingPosts.has(post.id);
    const avatarGradient = getAvatarGradient(post.user_name);

    return (
      <Card 
        className="group relative overflow-hidden bg-card/70 backdrop-blur-xl border-primary/10 shadow-lg hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 animate-fade-in"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* Decorative gradient line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg drop-shadow-sm">
                  {post.user_name.charAt(0).toUpperCase()}
                </span>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground tracking-tight">{post.user_name}</p>
                <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-primary/40" />
                  {formatTimeAgo(post.created_at)}
                </p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Category badge */}
          {post.category && post.category !== 'general' && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Hash className="h-3 w-3" />
                {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
              </span>
            </div>
          )}

          <p className="text-foreground/90 mb-5 leading-relaxed text-[15px] whitespace-pre-wrap">{renderContentWithMentions(post.content)}</p>

          {showActions && (
            <div className="flex items-center gap-6 pt-4 border-t border-primary/5">
              <button
                onClick={() => handleToggleLike(post.id, post.isLiked || false)}
                disabled={isLiking}
                className={`flex items-center gap-2 text-sm transition-all duration-300 group/like ${
                  post.isLiked 
                    ? 'text-rose-500' 
                    : 'text-muted-foreground/70 hover:text-rose-500'
                }`}
              >
                <div className={`relative ${post.isLiked ? 'animate-scale-in' : ''}`}>
                  <Heart 
                    className={`h-5 w-5 transition-all duration-300 ${
                      post.isLiked 
                        ? 'fill-rose-500 scale-110' 
                        : 'group-hover/like:scale-110'
                    } ${isLiking ? 'animate-pulse' : ''}`} 
                  />
                  {post.isLiked && (
                    <div className="absolute inset-0 animate-ping">
                      <Heart className="h-5 w-5 fill-rose-500 opacity-50" />
                    </div>
                  )}
                </div>
                <span className="font-medium tabular-nums">{post.likeCount || 0}</span>
              </button>
              <button
                onClick={() => setSelectedPost(post)}
                className="flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-primary transition-all duration-300 group/reply"
              >
                <MessageCircle className="h-5 w-5 group-hover/reply:scale-110 transition-transform duration-300" />
                <span className="font-medium tabular-nums">{post.replies?.length || 0}</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Replies View
  if (selectedPost) {
    const avatarGradient = getAvatarGradient(selectedPost.user_name);
    
    return (
      <Layout>
        <div className="min-h-screen pb-24">
          {/* Hero gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative px-4 pt-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Guftagu</span>
            </button>

            {/* Original Post - Enhanced */}
            <Card className="relative overflow-hidden bg-card/80 backdrop-blur-xl border-primary/15 shadow-xl mb-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg ring-2 ring-primary/20`}>
                    <span className="text-white font-bold text-xl drop-shadow-sm">
                      {selectedPost.user_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-foreground">{selectedPost.user_name}</p>
                    <p className="text-sm text-muted-foreground/60">{formatTimeAgo(selectedPost.created_at)}</p>
                  </div>
                </div>
                {/* Category badge */}
                {selectedPost.category && selectedPost.category !== 'general' && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      <Hash className="h-3 w-3" />
                      {CATEGORIES.find(c => c.id === selectedPost.category)?.label || selectedPost.category}
                    </span>
                  </div>
                )}
                <p className="text-foreground/90 text-[16px] leading-relaxed whitespace-pre-wrap">{renderContentWithMentions(selectedPost.content)}</p>
                
                {/* Stats bar */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-primary/10">
                  <div className="flex items-center gap-1.5 text-rose-500">
                    <Heart className="h-4 w-4 fill-rose-500" />
                    <span className="text-sm font-medium">{selectedPost.likeCount || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-primary">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedPost.replies?.length || 0} replies</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <div className="mb-6">
              <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Replies
              </h3>

              <div className="space-y-3">
                {selectedPost.replies?.map((reply, index) => {
                  const isOwner = user?.uid === reply.user_id;
                  const replyGradient = getAvatarGradient(reply.user_name);
                  
                  return (
                    <div 
                      key={reply.id} 
                      className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-primary/5 animate-fade-in hover:bg-card/70 transition-colors duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${replyGradient} flex items-center justify-center shadow-md`}>
                            <span className="text-white font-bold text-sm">
                              {reply.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground">{reply.user_name}</span>
                            <span className="text-xs text-muted-foreground/50 ml-2">• {formatTimeAgo(reply.created_at)}</span>
                          </div>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteReply(reply.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed pl-12">{renderContentWithMentions(reply.content)}</p>
                    </div>
                  );
                })}

                {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                  <div className="text-center py-12 bg-card/30 rounded-2xl border border-dashed border-primary/10">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-muted-foreground/70 font-medium mb-1">No replies yet</p>
                    <p className="text-sm text-muted-foreground/50">Be the first to reply!</p>
                  </div>
                )}
              </div>

              {/* Reply Input */}
              <div className="mt-6 flex gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(currentUserName)} flex items-center justify-center shadow-md shrink-0`}>
                  <span className="text-white font-bold text-sm">
                    {currentUserName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      value={newReply}
                      onChange={(e) => handleContentChange(e.target.value, 'reply')}
                      placeholder="Write a reply... Use @ to tag users"
                      className="min-h-[48px] max-h-[120px] resize-none bg-card/60 border-primary/10 focus:border-primary/30 rounded-xl"
                    />
                    {/* Mention suggestions for reply */}
                    {showMentionSuggestions && mentionTarget === 'reply' && filteredSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-primary/20 rounded-lg shadow-lg overflow-hidden z-50">
                        {filteredSuggestions.map((name) => (
                          <button
                            key={name}
                            onClick={() => insertMention(name)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-2 transition-colors"
                          >
                            <AtSign className="h-3 w-3 text-primary" />
                            <span className="font-medium">{name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleAddReply}
                    disabled={!newReply.trim() || submitting}
                    size="icon"
                    className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20 shrink-0"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        ref={containerRef}
        className="min-h-screen pb-24 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hero gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent pointer-events-none" />
        
        {/* Pull to refresh indicator */}
        <div 
          className="flex items-center justify-center transition-all duration-200 overflow-hidden"
          style={{ height: pullDistance > 0 ? pullDistance : refreshing ? 50 : 0 }}
        >
          <RefreshCw 
            className={`h-6 w-6 text-primary transition-transform duration-200 ${
              refreshing ? 'animate-spin' : ''
            }`}
            style={{ 
              transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
              opacity: pullDistance > 20 || refreshing ? 1 : 0
            }}
          />
        </div>

        <div className="relative px-4 pt-6">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  <MessageCircle className="h-6 w-6 text-primary-foreground" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary tracking-tight">Guftagu</h1>
                <p className="text-sm text-muted-foreground/70">Share & connect with the community</p>
              </div>
            </div>
            
            {/* Stats Row */}
            {!loading && posts.length > 0 && (
              <div className="flex items-center gap-4 mt-4 animate-fade-in">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground/80">{posts.length} posts</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-primary/10">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium text-foreground/80">{totalLikes} likes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-primary/10">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-foreground/80">{totalReplies} replies</span>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
              {CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
                    selectedCategory === id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-primary/10"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
                <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-muted-foreground/60 mt-4">Loading conversations...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-card/30 backdrop-blur-sm rounded-3xl border border-dashed border-primary/10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5">
                <MessageCircle className="h-10 w-10 text-primary/40" />
              </div>
              <p className="text-lg font-semibold text-foreground/80 mb-2">
                {selectedCategory === 'all' ? 'No conversations yet' : `No ${CATEGORIES.find(c => c.id === selectedCategory)?.label} posts yet`}
              </p>
              <p className="text-sm text-muted-foreground/60 mb-6">Start the first Guftagu!</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start a conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Create Post Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all duration-300 z-50"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/15">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Share Your Thoughts
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/70">
                Post a message for the community to see and engage with.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger className="w-[180px] bg-background/50 border-primary/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.id !== 'all').map(({ id, label }) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(currentUserName)} flex items-center justify-center shadow-md shrink-0`}>
                  <span className="text-white font-bold text-sm">
                    {currentUserName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="relative flex-1">
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => handleContentChange(e.target.value, 'post')}
                    placeholder="What's on your mind... Use @ to tag users"
                    className="min-h-[120px] resize-none bg-background/50 border-primary/10 focus:border-primary/30 rounded-xl"
                    maxLength={500}
                  />
                  {/* Mention suggestions */}
                  {showMentionSuggestions && mentionTarget === 'post' && filteredSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-primary/20 rounded-lg shadow-lg overflow-hidden z-50">
                      {filteredSuggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => insertMention(name)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 flex items-center gap-2 transition-colors"
                        >
                          <AtSign className="h-3 w-3 text-primary" />
                          <span className="font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/60 tabular-nums">
                  {newPostContent.length}/500
                </span>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || submitting}
                  className="shadow-lg shadow-primary/20 px-6"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
