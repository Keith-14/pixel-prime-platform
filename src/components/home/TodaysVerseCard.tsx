import { Card } from "@/components/ui/card";
import { BookOpen, Star } from "lucide-react";

export const TodaysVerseCard = () => {
  return (
    <Card className="relative overflow-hidden glass-gold px-5 py-5 shine-effect border-glow">
      {/* Decorative glow */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_bottom_right,hsl(145_55%_35%/0.1),transparent_60%)] pointer-events-none" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gold-gradient">Today's Verse</h2>
            <Star className="h-3 w-3 text-primary/60 fill-primary/30" />
          </div>
          <p className="text-sm text-foreground leading-relaxed italic">
            "Indeed, with hardship comes ease." <span className="text-primary/80 not-italic">(Qur'an 94:6)</span>
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30 text-primary shrink-0 shadow-[0_0_20px_-5px_hsl(45_85%_58%/0.3)] group">
          <BookOpen className="h-5 w-5" strokeWidth={1.5} />
        </span>
      </div>
    </Card>
  );
};
