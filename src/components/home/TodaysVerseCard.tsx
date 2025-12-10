import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const TodaysVerseCard = () => {
  return (
    <Card className="rounded-3xl border-none bg-sage-dark px-5 py-5 text-primary-foreground shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
            Today's Verse
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/90">
            "Indeed, with hardship comes ease." (Qur'an 94:6)
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cream/10 text-cream">
          <BookOpen className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
};
