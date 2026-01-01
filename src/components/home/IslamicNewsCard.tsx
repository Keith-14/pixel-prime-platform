import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink, Sparkles } from "lucide-react";

const newsItems = [
  {
    title: "Ramadan 2025 Expected to Begin in Late February",
    source: "Islamic Foundation",
  },
  {
    title: "New Mosque Opens in London, Largest in Europe",
    source: "Muslim World News",
  },
  {
    title: "Hajj 2025 Registration Opens for International Pilgrims",
    source: "Saudi Ministry",
  },
];

export const IslamicNewsCard = () => {
  return (
    <Card className="relative overflow-hidden glass-gold p-5 shine-effect border-glow">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-emerald-dark/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,hsl(45_85%_58%/0.12),transparent_60%)] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30 shadow-[0_0_15px_-3px_hsl(45_85%_58%/0.3)]">
            <Newspaper className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-sm font-bold text-gold-gradient flex items-center gap-2">
            Islamic World News
            <Sparkles className="h-3 w-3 text-primary/60" />
          </h2>
        </div>
        
        <div className="space-y-3">
          {newsItems.map((news, index) => (
            <div 
              key={index} 
              className="group flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-secondary/60 to-secondary/40 border border-border/50 hover:border-primary/40 hover:from-secondary/80 hover:to-secondary/60 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_-5px_hsl(45_85%_58%/0.15)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground group-hover:text-gold-gradient transition-all duration-300">
                  {news.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{news.source}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-primary/15 to-primary/10 border border-primary/30 hover:from-primary/25 hover:to-primary/15 hover:border-primary/50 hover:shadow-[0_0_20px_-5px_hsl(45_85%_58%/0.3)] transition-all duration-300 text-xs font-bold uppercase tracking-wider text-primary">
          View All News
        </button>
      </div>
    </Card>
  );
};
