import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Moon } from "lucide-react";

interface PrayerOverviewCardProps {
  currentPrayerName: string;
  currentTime: string;
  nextTimeLabel: string;
}

export const PrayerOverviewCard = ({
  currentPrayerName,
  currentTime,
  nextTimeLabel,
}: PrayerOverviewCardProps) => {
  const { t } = useLanguage();

  const PRAYER_NAMES = [
    { key: 'fajr', label: t('prayer.fajr') },
    { key: 'dhuhr', label: t('prayer.dhuhr') },
    { key: 'maghrib', label: t('prayer.maghrib') },
    { key: 'asr', label: t('prayer.asr') },
    { key: 'isha', label: t('prayer.isha') },
  ];

  const normalizePrayerName = (label: string) => {
    if (!label) return "";
    return label
      .replace("Next:", "")
      .replace("Time", "")
      .trim()
      .split(" ")[0]
      .toLowerCase();
  };

  const activePrayer = normalizePrayerName(currentPrayerName);

  const getDisplayPrayerName = () => {
    const prayer = PRAYER_NAMES.find(p => p.key === activePrayer);
    return prayer ? prayer.label : t('prayer.upcoming');
  };

  // Get active prayer index for the curve
  const activePrayerIndex = PRAYER_NAMES.findIndex(p => p.key === activePrayer);

  return (
    <Card className="relative overflow-hidden border border-primary/30 bg-card/80 backdrop-blur-sm p-5 shadow-lg">
      {/* Ambient glow at horizon */}
      <div className="absolute inset-x-0 bottom-1/3 h-24 bg-[radial-gradient(ellipse_at_center,hsl(45_70%_50%/0.15),transparent_70%)]" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('home.next_prayer')}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {getDisplayPrayerName()}
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-[180px] leading-relaxed">
            {nextTimeLabel || t('home.next_prayer_at')}
          </p>
        </div>

        <div className="text-right flex items-start gap-3">
          <Moon className="h-10 w-10 text-primary mt-1" strokeWidth={1.5} />
          <div>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">
              {currentTime || "--:--:--"}
            </p>
          </div>
        </div>
      </div>

      {/* Prayer timeline with curve */}
      <div className="relative z-10 mt-6">
        {/* Curved line SVG */}
        <svg 
          className="absolute inset-x-0 top-0 h-12 w-full" 
          viewBox="0 0 320 48" 
          preserveAspectRatio="none"
        >
          <path
            d="M 10 40 Q 80 5, 160 5 Q 240 5, 310 40"
            fill="none"
            stroke="hsl(45 70% 55% / 0.4)"
            strokeWidth="2"
          />
          {/* Glowing dot on curve based on active prayer */}
          {activePrayerIndex >= 0 && (
            <circle
              cx={10 + (activePrayerIndex * 75)}
              cy={activePrayerIndex === 2 ? 5 : activePrayerIndex === 1 || activePrayerIndex === 3 ? 15 : 35}
              r="6"
              fill="hsl(45 70% 55%)"
              className="animate-pulse"
              style={{ filter: 'drop-shadow(0 0 8px hsl(45 70% 55%))' }}
            />
          )}
        </svg>

        {/* Prayer labels */}
        <div className="flex items-end justify-between pt-10 px-2">
          {PRAYER_NAMES.map(({ key, label }, index) => (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  activePrayer === key 
                    ? "bg-primary scale-125 shadow-[0_0_8px_hsl(45_70%_55%)]" 
                    : "bg-muted-foreground/40"
                )}
              />
              <span
                className={cn(
                  "text-[10px] tracking-wide transition-all duration-300",
                  activePrayer === key 
                    ? "font-bold text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
