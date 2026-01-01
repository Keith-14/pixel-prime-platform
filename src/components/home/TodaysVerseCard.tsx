import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const TodaysVerseCard = () => {
  return (
    <Card className="border border-primary/30 bg-card/80 backdrop-blur-sm px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-primary">Today's Verse</h2>
          <p className="mt-2.5 text-sm text-foreground leading-relaxed">
            "Indeed, with hardship comes ease." (Qur'an 94:6)
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/30 text-primary shrink-0">
          <BookOpen className="h-5 w-5" strokeWidth={1.5} />
        </span>
      </div>
    </Card>
  );
};
