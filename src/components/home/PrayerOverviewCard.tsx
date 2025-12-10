import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PrayerOverviewCardProps {
  currentPrayerName: string;
  currentTime: string;
  nextTimeLabel: string;
}

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const normalizePrayerName = (label: string) => {
  if (!label) return "";
  return label
    .replace("Next:", "")
    .replace("Time", "")
    .trim()
    .split(" ")[0];
};

export const PrayerOverviewCard = ({
  currentPrayerName,
  currentTime,
  nextTimeLabel,
}: PrayerOverviewCardProps) => {
  const activePrayer = normalizePrayerName(currentPrayerName);

  return (
    <Card className="relative overflow-hidden rounded-3xl border-none bg-sage-dark px-5 py-5 text-primary-foreground shadow-lg">

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
            Next Prayer
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-cream drop-shadow-sm">
            {activePrayer || "Upcoming"}
          </p>
          <p className="mt-2 text-xs text-cream/70 max-w-[180px] leading-relaxed">
            {nextTimeLabel || "Prayer times update throughout the day."}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest text-cream/80">
            Current Time
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-cream drop-shadow-sm">
            {currentTime || "--:--:--"}
          </p>
        </div>
      </div>

      {/* Prayer indicator strip */}
      <div className="relative z-10 mt-5 flex items-center justify-between rounded-2xl bg-sage-dark/50 backdrop-blur-sm px-4 py-3 border border-cream/10">
        {PRAYER_NAMES.map((name) => (
          <div key={name} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all duration-300",
                activePrayer === name 
                  ? "bg-cream shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                  : "bg-cream/30"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-wide transition-all duration-300",
                activePrayer === name 
                  ? "font-semibold text-cream" 
                  : "text-cream/60"
              )}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
