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
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(210,80%,50%)] via-[hsl(215,75%,45%)] to-[hsl(220,70%,38%)] p-5 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-white/20">
          <Newspaper className="h-4 w-4" strokeWidth={2} />
        </div>
        <h2 className="text-sm font-semibold">Islamic World News</h2>
      </div>
      
      <div className="space-y-3">
        {newsItems.map((news, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug line-clamp-2">
                {news.title}
              </p>
              <p className="text-xs text-white/60 mt-1">{news.source}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-white/50 shrink-0 mt-0.5" strokeWidth={2} />
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium">
        View All News
      </button>
    </Card>
  );
};