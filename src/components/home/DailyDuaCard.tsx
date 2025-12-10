import { Card } from "@/components/ui/card";

export const DailyDuaCard = () => {
  return (
    <Card className="rounded-3xl border-none bg-sage-dark px-5 py-5 text-primary-foreground shadow-lg">
      <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
        Daily Dua
      </p>
      <p className="mt-3 text-sm leading-relaxed text-cream/90">
        "O Allah, I ask You for beneficial knowledge, good provision, and
        acceptable deeds."
      </p>
      <div className="mt-4 flex gap-2 text-[11px]">
        <span className="rounded-full bg-cream/20 px-3 py-1.5 font-medium text-cream">
          Arabic
        </span>
        <span className="rounded-full bg-cream/10 px-3 py-1.5 text-cream/70">
          English
        </span>
      </div>
    </Card>
  );
};
