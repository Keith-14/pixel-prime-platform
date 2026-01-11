import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { MessageCircle, Plus, Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  replies?: Reply[];
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

export const Forum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Fetch posts with their replies
  const fetchPosts = async () => {
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

      // Group replies by post_id
      const repliesByPost: Record<string, Reply[]> = {};
      (repliesData || []).forEach((reply) => {
        if (!repliesByPost[reply.post_id]) {
          repliesByPost[reply.post_id] = [];
        }
        repliesByPost[reply.post_id].push(reply);
      });

      // Attach replies to posts
      const postsWithReplies = (postsData || []).map((post) => ({
        ...post,
        replies: repliesByPost[post.id] || [],
      }));

      setPosts(postsWithReplies);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };
  // Set up real-time subscriptions
  useEffect(() => {
    fetchPosts();

    // Subscribe to new posts
    const postsChannel = supabase
      .channel('guftagu-posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guftagu_posts' },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
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

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  // Subscribe to replies when a post is selected
  useEffect(() => {
    if (!selectedPost) return;

    // Get current replies from posts state
    const currentPost = posts.find(p => p.id === selectedPost.id);
    if (currentPost && currentPost.replies) {
      setSelectedPost(prev => prev ? { ...prev, replies: currentPost.replies } : null);
    }

    const repliesChannel = supabase
      .channel(`guftagu-replies-${selectedPost.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guftagu_replies', filter: `post_id=eq.${selectedPost.id}` },
        (payload) => {
          const newReply = payload.new as Reply;
          setSelectedPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              replies: [...(prev.replies || []), newReply]
            };
          });
          // Also update posts state
          setPosts((prev) => prev.map(p => 
            p.id === selectedPost.id 
              ? { ...p, replies: [...(p.replies || []), newReply] }
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
        user_id: user.id,
        user_name: currentUserName,
        content: newPostContent.trim(),
      });

      if (error) throw error;

      setNewPostContent('');
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

  const handleAddReply = async () => {
    if (!newReply.trim() || !user || !selectedPost) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('guftagu_replies').insert({
        post_id: selectedPost.id,
        user_id: user.id,
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

  const PostCard = ({ post, showActions = true }: { post: Post; showActions?: boolean }) => {
    const isOwner = user?.id === post.user_id;

    return (
      <Card className="bg-card/60 backdrop-blur-sm border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-primary font-bold text-sm">
                  {post.user_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">{post.user_name}</p>
                <p className="text-xs text-muted-foreground/70">{formatTimeAgo(post.created_at)}</p>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost(post.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-foreground/90 mb-5 leading-relaxed text-[15px]">{post.content}</p>

          {showActions && (
            <div className="flex items-center gap-4 pt-3 border-t border-primary/10">
              <button
                onClick={() => setSelectedPost(post)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200 group"
              >
                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Reply</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Replies View
  if (selectedPost) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
          <div className="px-4 pt-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-5"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>

            <PostCard post={selectedPost} showActions={false} />

            <div className="mt-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Replies ({selectedPost.replies?.length || 0})
              </h3>

              <div className="space-y-3">
                {selectedPost.replies?.map((reply) => {
                  const isOwner = user?.id === reply.user_id;
                  return (
                    <div key={reply.id} className="bg-card/40 backdrop-blur-sm rounded-xl p-4 border border-primary/5">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-1 ring-primary/15">
                            <span className="text-primary font-bold text-xs">
                              {reply.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-sm text-foreground">{reply.user_name}</span>
                          <span className="text-xs text-muted-foreground/60">• {formatTimeAgo(reply.created_at)}</span>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteReply(reply.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/85 pl-10 leading-relaxed">{reply.content}</p>
                    </div>
                  );
                })}

                {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                  <div className="text-center py-8 bg-card/20 rounded-xl border border-dashed border-primary/10">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-muted-foreground/70 text-sm">
                      No replies yet. Be the first to reply!
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 min-h-[48px] max-h-[120px] resize-none bg-card/50 border-primary/15 focus:border-primary/30"
                />
                <Button
                  onClick={handleAddReply}
                  disabled={!newReply.trim() || submitting}
                  size="icon"
                  className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
        <div className="px-4 pt-6">
          {/* Header with accent */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-primary mb-1.5 tracking-tight">Guftagu</h1>
            <p className="text-sm text-muted-foreground/80">Share and connect with the community</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground/60">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-card/30 rounded-2xl border border-dashed border-primary/10">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground/70 mb-1">No posts yet</p>
              <p className="text-sm text-muted-foreground/50">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Floating Create Post Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/15">
            <DialogHeader>
              <DialogTitle className="text-primary">Share Your Thoughts</DialogTitle>
              <DialogDescription className="text-muted-foreground/70">Post a message for the community to see and reply.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind..."
                className="min-h-[120px] resize-none bg-background/50 border-primary/15 focus:border-primary/30"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground/60">
                  {newPostContent.length}/500
                </span>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || submitting}
                  className="shadow-lg shadow-primary/20"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
