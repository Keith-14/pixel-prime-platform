import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Globe, BookOpen, Users, Heart, Building2, Sparkles, ExternalLink, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type NewsCategory = 'all' | 'world' | 'education' | 'community' | 'charity' | 'business' | 'politics';

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  article_url: string;
  source: string;
  category: NewsCategory;
  time: string;
}

const categories: { key: NewsCategory; labelKey: string; icon: typeof Globe }[] = [
  { key: 'all', labelKey: 'news.category.all', icon: Newspaper },
  { key: 'world', labelKey: 'news.category.world', icon: Globe },
  { key: 'education', labelKey: 'news.category.education', icon: BookOpen },
  { key: 'community', labelKey: 'news.category.community', icon: Users },
  { key: 'charity', labelKey: 'news.category.charity', icon: Heart },
  { key: 'business', labelKey: 'news.category.business', icon: Building2 },
  { key: 'politics', labelKey: 'news.category.politics', icon: Globe },
];

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const News = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('news_articles')
      .select('id, title, description, image_url, article_url, source_name, published_at, category')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(50);
    if (selectedCategory !== 'all') q = q.eq('category', selectedCategory);
    const { data, error } = await q;
    if (!error && data) {
      setItems(
        data.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          image_url: d.image_url,
          article_url: d.article_url,
          source: d.source_name,
          category: (d.category as NewsCategory) ?? 'world',
          time: timeAgo(d.published_at),
        })),
      );
    }
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news');
      if (error) throw error;
      toast({ title: 'Feed refreshed', description: `Fetched ${data?.totalProcessed ?? 0} items` });
      await load();
    } catch (e) {
      toast({ title: 'Refresh failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const getCategoryIcon = (category: NewsCategory) => {
    const found = categories.find(c => c.key === category);
    return found ? found.icon : Globe;
  };

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6 font-arabic">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <Newspaper className="h-8 w-8 text-primary relative z-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-gradient">{t('news.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('news.subtitle')}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={refreshing}
            className="ml-auto text-primary hover:bg-primary/10 rounded-full"
            aria-label="Refresh news"
          >
            {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(({ key, labelKey, icon: Icon }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 shrink-0 transition-all duration-300",
                selectedCategory === key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-primary border border-transparent"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">{t(labelKey)}</span>
            </Button>
          ))}
        </div>

        {/* News List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Sparkles className="h-8 w-8 text-primary/60 mx-auto" />
            <p className="text-sm text-muted-foreground">No articles yet. Tap refresh to load the latest news.</p>
            <Button onClick={refresh} disabled={refreshing} className="rounded-full">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Fetch news
            </Button>
          </div>
        ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const CategoryIcon = getCategoryIcon(item.category);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/news/${item.id}`)}
                className="block w-full text-left"
              >
              <Card
                className={cn(
                  "relative overflow-hidden glass-dark p-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group",
                  "animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-start gap-4">
                  {/* Image or Category Icon */}
                  <div className="shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 rounded-xl object-cover border border-primary/15"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center group-hover:border-primary/30 transition-all duration-300">
                        <CategoryIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none">
                        {item.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0" />
                </div>
              </Card>
              </button>
            );
          })}
        </div>
        )}
      </div>
    </Layout>
  );
};
