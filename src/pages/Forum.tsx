import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, Plus, Send, ArrowLeft, Loader2, Trash2, Heart, RefreshCw, 
  Sparkles, Users, TrendingUp, Hash, AtSign, Search, X, Bookmark, Share2, User, ChevronRight 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Post categories (limited to mockup set)
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'dua', label: 'Dua Requests' },
  { id: 'knowledge', label: 'Deen & Knowledge' },
];

// Daily duas collection
const DAILY_DUAS = [
  {
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ',
    translation: 'O Allah, You are my Lord. There is no god but You. You created me and I am Your servant.',
  },
  {
    arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    translation: 'My Lord, forgive me and my parents and the believers on the Day the account is established.',
  },
  {
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا',
    translation: 'O Allah, I ask You for beneficial knowledge, good provision, and accepted deeds.',
  },
  {
    arabic: 'اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
    translation: 'O Allah, make me among those who repent and make me among those who purify themselves.',
  },
  {
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عِلْمٍ لاَ يَنْفَعُ وَمِنْ قَلْبٍ لاَ يَخْشَعُ',
    translation: 'O Allah, I seek refuge in You from knowledge that does not benefit, and a heart that does not humble itself.',
  },
  {
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    translation: 'O Allah, help me to remember You, to thank You, and to worship You in the best manner.',
  },
  {
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    translation: 'Glory is to Allah and praise is to Him, glory is to Allah the Magnificent.',
  },
];

const getTodaysDua = () => {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_DUAS[dayOfYear % DAILY_DUAS.length];
};

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
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

// Helper function to render content with @mentions highlighted
const renderContentWithMentions = (content: string) => {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return parts.map((part, index) => {
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

const BROWN = '#8B5E3C';
const BROWN_LIGHT = '#A67B5B';
const BROWN_DARK = '#5C3A2A';
const CREAM_BG = 'rgba(255, 235, 201, 0.06)';
const WARM_CARD = 'rgba(60, 45, 30, 0.35)';

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
  const [activeTab, setActiveTab] = useState<'announcements' | 'communities'>('announcements');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  
  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const PULL_THRESHOLD = 80;

  const todaysDua = getTodaysDua();

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

  // Get filtered posts based on selected category and search
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || post.content.toLowerCase().includes(searchQuery.toLowerCase()) || post.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Fetch posts with their replies and likes
  const fetchPosts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('guftagu_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: repliesData, error: repliesError } = await supabase
        .from('guftagu_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const { data: likesData, error: likesError } = await supabase
        .from('guftagu_likes')
        .select('*');

      if (likesError) throw likesError;

      const repliesByPost: Record<string, Reply[]> = {};
      (repliesData || []).forEach((reply) => {
        if (!repliesByPost[reply.post_id]) {
          repliesByPost[reply.post_id] = [];
        }
        repliesByPost[reply.post_id].push(reply);
      });

      const likesByPost: Record<string, Like[]> = {};
      (likesData || []).forEach((like) => {
        if (!likesByPost[like.post_id]) {
          likesByPost[like.post_id] = [];
        }
        likesByPost[like.post_id].push(like);
      });

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

  useEffect(() => {
    fetchPosts();
    fetchUserNames();

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

    const likesChannel = supabase
      .channel('guftagu-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guftagu_likes' },
        () => {
          fetchPosts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [fetchPosts, fetchUserNames]);

  const handleContentChange = (value: string, target: 'post' | 'reply') => {
    if (target === 'post') {
      setNewPostContent(value);
    } else {
      setNewReply(value);
    }
    
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

  useEffect(() => {
    if (!selectedPost) return;

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

  const handleToggleBookmark = (postId: string) => {
    setBookmarkedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        toast.success('Removed from bookmarks');
      } else {
        next.add(postId);
        toast.success('Saved to bookmarks');
      }
      return next;
    });
  };

  const handleShare = async (post: Post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.user_name}`,
          text: post.content,
        });
      } else {
        await navigator.clipboard.writeText(post.content);
        toast.success('Copied to clipboard');
      }
    } catch {
      // User cancelled share
    }
  };

  const getCategoryBadgeColor = (category?: string) => {
    switch (category) {
      case 'general': return 'bg-emerald-500/20 text-emerald-400';
      case 'dua': return 'bg-amber-500/20 text-amber-400';
      case 'knowledge': return 'bg-sky-500/20 text-sky-400';
      default: return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  const getCategoryLabel = (category?: string) => {
    return CATEGORIES.find(c => c.id === category)?.label || 'General';
  };

  const PostCard = ({ post, index = 0 }: { post: Post; index?: number }) => {
    const isOwner = user?.uid === post.user_id;
    const isLiking = likingPosts.has(post.id);
    const isBookmarked = bookmarkedPosts.has(post.id);
    const contentPreview = post.content.length > 180 ? post.content.slice(0, 180) + '...' : post.content;
    const hasMore = post.content.length > 180;

    return (
      <Card 
        className="group relative overflow-hidden border-0 shadow-none animate-fade-in"
        style={{ 
          animationDelay: `${index * 80}ms`,
          background: WARM_CARD,
        }}
      >
        <CardContent className="p-4">
          {/* Header: Avatar + Name + Category + Time */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <User className="h-5 w-5" style={{ color: 'rgba(255,235,201,0.5)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm">{post.user_name}</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide", getCategoryBadgeColor(post.category))}>
                  {getCategoryLabel(post.category)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/50 mt-0.5">{formatTimeAgo(post.created_at)}</p>
            </div>
            {isOwner && (
              <button
                className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mb-3">
            <p className="text-foreground/85 text-sm leading-relaxed">
              {renderContentWithMentions(contentPreview)}
              {hasMore && (
                <button 
                  onClick={() => setSelectedPost(post)}
                  className="text-sm ml-1 hover:underline"
                  style={{ color: BROWN_LIGHT }}
                >
                  Read more
                </button>
              )}
            </p>
          </div>

          {/* Image placeholder for posts with longer content (simulated feature post) */}
          {post.content.length > 250 && (
            <div 
              className="w-full h-40 rounded-xl mb-3 flex items-center justify-center"
              style={{ background: 'rgba(139, 94, 60, 0.15)' }}
              onClick={() => setSelectedPost(post)}
            >
              <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,235,201,0.3)' }}>
                IMAGE_PLACEHOLDER
              </span>
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-5">
              <button
                onClick={() => handleToggleLike(post.id, post.isLiked || false)}
                disabled={isLiking}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: post.isLiked ? '#e57373' : 'rgba(255,255,255,0.4)' }}
              >
                <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
                <span className="text-xs tabular-nums">{post.likeCount || 0}</span>
              </button>
              <button
                onClick={() => setSelectedPost(post)}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs tabular-nums">{post.replies?.length || 0}</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggleBookmark(post.id)}
                className="transition-colors"
                style={{ color: isBookmarked ? BROWN_LIGHT : 'rgba(255,255,255,0.4)' }}
              >
                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              </button>
              <button
                onClick={() => handleShare(post)}
                className="transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Replies View
  if (selectedPost) {
    return (
      <Layout>
        <div className="min-h-screen pb-24">
          <div className="relative px-4 pt-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium text-sm">Back to Guftagu</span>
            </button>

            <Card className="relative overflow-hidden border-0 mb-6" style={{ background: WARM_CARD }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <User className="h-6 w-6" style={{ color: 'rgba(255,235,201,0.5)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{selectedPost.user_name}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase", getCategoryBadgeColor(selectedPost.category))}>
                        {getCategoryLabel(selectedPost.category)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">{formatTimeAgo(selectedPost.created_at)}</p>
                  </div>
                </div>
                <p className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-wrap">{renderContentWithMentions(selectedPost.content)}</p>
                
                <div className="flex items-center gap-5 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5" style={{ color: selectedPost.isLiked ? '#e57373' : 'rgba(255,255,255,0.4)' }}>
                    <Heart className={cn("h-4 w-4", selectedPost.isLiked && "fill-current")} />
                    <span className="text-sm">{selectedPost.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{selectedPost.replies?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mb-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <MessageCircle className="h-4 w-4" style={{ color: BROWN_LIGHT }} />
                Replies
              </h3>

              <div className="space-y-3">
                {selectedPost.replies?.map((reply, index) => {
                  const isOwner = user?.uid === reply.user_id;
                  
                  return (
                    <div 
                      key={reply.id} 
                      className="rounded-2xl p-4 animate-fade-in"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        background: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.08)' }}
                          >
                            <User className="h-4 w-4" style={{ color: 'rgba(255,235,201,0.5)' }} />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground">{reply.user_name}</span>
                            <span className="text-xs text-muted-foreground/50 ml-2">{formatTimeAgo(reply.created_at)}</span>
                          </div>
                        </div>
                        {isOwner && (
                          <button
                            className="text-muted-foreground/30 hover:text-destructive transition-colors p-1"
                            onClick={() => handleDeleteReply(reply.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed pl-12">{renderContentWithMentions(reply.content)}</p>
                    </div>
                  );
                })}

                {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                  <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <MessageCircle className="h-8 w-8 mx-auto mb-3" style={{ color: 'rgba(255,235,201,0.2)' }} />
                    <p className="text-muted-foreground/50 font-medium text-sm">No replies yet</p>
                    <p className="text-xs text-muted-foreground/30 mt-1">Be the first to reply!</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <User className="h-4 w-4" style={{ color: 'rgba(255,235,201,0.5)' }} />
                </div>
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      value={newReply}
                      onChange={(e) => handleContentChange(e.target.value, 'reply')}
                      placeholder="Write a reply..."
                      className="min-h-[48px] max-h-[120px] resize-none rounded-xl border-0"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    {showMentionSuggestions && mentionTarget === 'reply' && filteredSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg shadow-lg overflow-hidden z-50 border"
                        style={{ background: 'rgba(30,30,30,0.95)', borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        {filteredSuggestions.map((name) => (
                          <button
                            key={name}
                            onClick={() => insertMention(name)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition-colors"
                          >
                            <AtSign className="h-3 w-3" style={{ color: BROWN_LIGHT }} />
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
                    className="h-12 w-12 rounded-xl shrink-0 border-0"
                    style={{ background: BROWN }}
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

  const headerRight = (
    <button
      onClick={() => {
        setSearchOpen(!searchOpen);
        if (searchOpen) setSearchQuery('');
      }}
      className="text-foreground hover:text-primary transition-colors p-2"
    >
      {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
    </button>
  );

  return (
    <Layout headerTitle="Guftagu" headerRight={headerRight}>
      <div 
        ref={containerRef}
        className="min-h-screen pb-24 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh indicator */}
        <div 
          className="flex items-center justify-center transition-all duration-200 overflow-hidden"
          style={{ height: pullDistance > 0 ? pullDistance : refreshing ? 50 : 0 }}
        >
          <RefreshCw 
            className={`h-5 w-5 transition-transform duration-200 ${refreshing ? 'animate-spin' : ''}`}
            style={{ 
              color: BROWN_LIGHT,
              transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
              opacity: pullDistance > 20 || refreshing ? 1 : 0
            }}
          />
        </div>

        <div className="relative px-4 pt-2">
          {/* Search Bar */}
          {searchOpen && (
            <div className="mb-4 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center mb-4">
            <button
              onClick={() => setActiveTab('announcements')}
              className="relative pb-2.5 px-1 mr-6"
            >
              <span 
                className="text-sm font-medium transition-colors"
                style={{ color: activeTab === 'announcements' ? BROWN_LIGHT : 'rgba(255,255,255,0.4)' }}
              >
                Announcements
              </span>
              {activeTab === 'announcements' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: BROWN_LIGHT }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className="relative pb-2.5 px-1"
            >
              <span 
                className="text-sm font-medium transition-colors"
                style={{ color: activeTab === 'communities' ? BROWN_LIGHT : 'rgba(255,255,255,0.4)' }}
              >
                My Communities
              </span>
              {activeTab === 'communities' && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: BROWN_LIGHT }}
                />
              )}
            </button>
          </div>

          {activeTab === 'communities' ? (
            <div className="text-center py-20">
              <Users className="h-10 w-10 mx-auto mb-4" style={{ color: 'rgba(255,235,201,0.2)' }} />
              <p className="text-muted-foreground/60 font-medium">My Communities</p>
              <p className="text-sm text-muted-foreground/40 mt-1">Coming soon</p>
            </div>
          ) : (
            <>
              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                {CATEGORIES.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(id)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border",
                      selectedCategory === id
                        ? "text-white border-transparent"
                        : "text-foreground/50 hover:text-foreground/70 border-white/10"
                    )}
                    style={selectedCategory === id ? { background: BROWN, borderColor: 'transparent' } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Today's Dua Card */}
              <Card 
                className="mb-5 border-0 overflow-hidden"
                style={{ background: CREAM_BG }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤲</span>
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: BROWN_LIGHT }}
                      >
                        TODAY'S DUA
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${todaysDua.arabic}\n${todaysDua.translation}`);
                        toast.success('Dua copied to clipboard');
                      }}
                      className="p-1 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-center text-lg leading-loose mb-3 font-arabic" style={{ color: 'rgba(255,235,201,0.7)' }}>
                    {todaysDua.arabic}
                  </p>
                  <p className="text-xs text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {todaysDua.translation}
                  </p>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: BROWN_LIGHT }} />
                  <p className="text-sm text-muted-foreground/50 mt-3">Loading conversations...</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <MessageCircle className="h-10 w-10 mx-auto mb-4" style={{ color: 'rgba(255,235,201,0.2)' }} />
                  <p className="text-foreground/60 font-medium mb-1">
                    {searchQuery ? 'No results found' : selectedCategory === 'all' ? 'No conversations yet' : `No ${CATEGORIES.find(c => c.id === selectedCategory)?.label} posts yet`}
                  </p>
                  <p className="text-sm text-muted-foreground/40 mb-5">Start the first Guftagu!</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="rounded-full px-5"
                    style={{ background: BROWN }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start a conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post, index) => (
                    <PostCard key={post.id} post={post} index={index} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Create Post Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-50 border-0"
              size="icon"
              style={{ background: BROWN }}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-0"
            style={{ background: 'rgba(25,25,25,0.98)' }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2" style={{ color: BROWN_LIGHT }}>
                <Sparkles className="h-5 w-5" />
                Share Your Thoughts
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/50 text-sm">
                Post a message for the community to see and engage with.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground/50" />
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger className="w-[180px] text-sm border-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'rgba(30,30,30,0.98)' }}>
                    {CATEGORIES.filter(c => c.id !== 'all').map(({ id, label }) => (
                      <SelectItem key={id} value={id}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <User className="h-4 w-4" style={{ color: 'rgba(255,235,201,0.5)' }} />
                </div>
                <div className="relative flex-1">
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => handleContentChange(e.target.value, 'post')}
                    placeholder="What's on your mind..."
                    className="min-h-[120px] resize-none rounded-xl border-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                    maxLength={500}
                  />
                  {showMentionSuggestions && mentionTarget === 'post' && filteredSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg shadow-lg overflow-hidden z-50 border"
                      style={{ background: 'rgba(30,30,30,0.95)', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      {filteredSuggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => insertMention(name)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center gap-2 transition-colors"
                        >
                          <AtSign className="h-3 w-3" style={{ color: BROWN_LIGHT }} />
                          <span className="font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/40 tabular-nums">
                  {newPostContent.length}/500
                </span>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || submitting}
                  className="rounded-full px-6 border-0"
                  style={{ background: BROWN }}
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
