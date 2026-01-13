import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Globe, BookOpen, Users, Heart, Building2, Sparkles, ExternalLink, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type NewsCategory = 'all' | 'world' | 'education' | 'community' | 'charity' | 'business';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: NewsCategory;
  time: string;
  imageUrl?: string;
}

const categories: { key: NewsCategory; labelKey: string; icon: typeof Globe }[] = [
  { key: 'all', labelKey: 'news.category.all', icon: Newspaper },
  { key: 'world', labelKey: 'news.category.world', icon: Globe },
  { key: 'education', labelKey: 'news.category.education', icon: BookOpen },
  { key: 'community', labelKey: 'news.category.community', icon: Users },
  { key: 'charity', labelKey: 'news.category.charity', icon: Heart },
  { key: 'business', labelKey: 'news.category.business', icon: Building2 },
];

const newsItems: NewsItem[] = [
  {
    id: '1',
    title: 'Historic Islamic Art Exhibition Opens in London',
    source: 'Al Jazeera',
    category: 'world',
    time: '2h ago',
  },
  {
    id: '2',
    title: 'New Scholarship Program for Muslim Students Announced',
    source: 'Muslim News',
    category: 'education',
    time: '4h ago',
  },
  {
    id: '3',
    title: 'Community Mosque Breaks Ground on New Community Center',
    source: 'Local News',
    category: 'community',
    time: '5h ago',
  },
  {
    id: '4',
    title: 'Ramadan Food Drive Collects Record Donations',
    source: 'Charity Weekly',
    category: 'charity',
    time: '6h ago',
  },
  {
    id: '5',
    title: 'Islamic Finance Summit Highlights Ethical Investing',
    source: 'Business Arabia',
    category: 'business',
    time: '8h ago',
  },
  {
    id: '6',
    title: 'Global Muslim Population Expected to Grow Significantly',
    source: 'World Report',
    category: 'world',
    time: '10h ago',
  },
  {
    id: '7',
    title: 'Online Quran Learning Platform Reaches 1 Million Users',
    source: 'Tech Islamic',
    category: 'education',
    time: '12h ago',
  },
  {
    id: '8',
    title: 'Youth Islamic Camp Inspires Next Generation Leaders',
    source: 'Community Voice',
    category: 'community',
    time: '14h ago',
  },
  {
    id: '9',
    title: 'Zakat Foundation Provides Aid to Flood Victims',
    source: 'Relief News',
    category: 'charity',
    time: '16h ago',
  },
  {
    id: '10',
    title: 'Halal Industry Market Value Surpasses $2 Trillion',
    source: 'Economic Times',
    category: 'business',
    time: '18h ago',
  },
];

export const News = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');

  const filteredNews = selectedCategory === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

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
          <Sparkles className="h-5 w-5 text-primary/60 ml-auto animate-pulse" />
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
        <div className="space-y-4">
          {filteredNews.map((item, index) => {
            const CategoryIcon = getCategoryIcon(item.category);
            return (
              <Card
                key={item.id}
                className={cn(
                  "relative overflow-hidden glass-dark p-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer group",
                  "animate-in fade-in slide-in-from-bottom-2"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 flex items-start gap-4">
                  {/* Category Icon */}
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center group-hover:border-primary/30 transition-all duration-300">
                      <CategoryIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
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
            );
          })}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            className="text-primary hover:bg-primary/10 rounded-full px-6"
          >
            <span>{t('news.load_more')}</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};
