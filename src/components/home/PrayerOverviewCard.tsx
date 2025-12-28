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
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(210,80%,50%)] via-[hsl(215,75%,45%)] to-[hsl(220,70%,38%)] px-5 py-6 text-white shadow-lg">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
            Next Prayer
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {activePrayer || "Upcoming"}
          </p>
          <p className="mt-2 text-xs text-primary-foreground/60 max-w-[180px] leading-relaxed">
            {nextTimeLabel || "Prayer times update throughout the day."}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
            Current Time
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
            {currentTime || "--:--:--"}
          </p>
        </div>
      </div>

      {/* Prayer indicator strip */}
      <div className="relative z-10 mt-6 flex items-center justify-between rounded-2xl bg-primary-foreground/10 backdrop-blur-sm px-4 py-3.5">
        {PRAYER_NAMES.map((name) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                activePrayer === name 
                  ? "bg-primary-foreground scale-125" 
                  : "bg-primary-foreground/30"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-wide transition-all duration-300",
                activePrayer === name 
                  ? "font-semibold text-primary-foreground" 
                  : "text-primary-foreground/50"
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