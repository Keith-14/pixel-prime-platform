import { Card } from "@/components/ui/card";

export const DailyDuaCard = () => {
  return (
    <Card className="border border-primary/30 bg-card/80 backdrop-blur-sm px-5 py-5">
      <h2 className="text-sm font-semibold text-primary">Daily Dua</h2>
      <p className="mt-2.5 text-sm text-foreground leading-relaxed">
        "O Allah, I ask You for beneficial knowledge, good provision, and
        acceptable deeds."
      </p>
      <div className="mt-4 flex gap-2">
        <span className="rounded-xl bg-primary/15 border border-primary/30 px-4 py-1.5 text-xs font-medium text-primary">
          Arabic
        </span>
        <span className="rounded-xl bg-secondary border border-border px-4 py-1.5 text-xs text-muted-foreground">
          English
        </span>
      </div>
    </Card>
  );
};
