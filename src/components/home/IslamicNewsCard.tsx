import { Card } from "@/components/ui/card";
import { Newspaper, ExternalLink } from "lucide-react";

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
    <Card className="relative overflow-hidden border border-primary/30 bg-card/80 backdrop-blur-sm p-5 shadow-lg">
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,hsl(45_70%_50%/0.1),transparent_70%)]" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-primary/15 border border-primary/30">
            <Newspaper className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-sm font-semibold text-primary">Islamic World News</h2>
        </div>
        
        <div className="space-y-3">
          {newsItems.map((news, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-primary/30 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
                  {news.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{news.source}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors text-xs font-medium text-primary">
          View All News
        </button>
      </div>
    </Card>
  );
};
