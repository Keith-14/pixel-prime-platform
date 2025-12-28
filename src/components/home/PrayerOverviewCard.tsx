import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
    { key: 'asr', label: t('prayer.asr') },
    { key: 'maghrib', label: t('prayer.maghrib') },
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

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[hsl(210,80%,50%)] via-[hsl(215,75%,45%)] to-[hsl(220,70%,38%)] px-5 py-6 text-white shadow-lg">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
            {t('home.next_prayer')}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {getDisplayPrayerName()}
          </p>
          <p className="mt-2 text-xs text-primary-foreground/60 max-w-[180px] leading-relaxed">
            {nextTimeLabel || t('home.next_prayer_at')}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/70">
            {t('home.current_time')}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
            {currentTime || "--:--:--"}
          </p>
        </div>
      </div>

      {/* Prayer indicator strip */}
      <div className="relative z-10 mt-6 flex items-center justify-between rounded-2xl bg-primary-foreground/10 backdrop-blur-sm px-4 py-3.5">
        {PRAYER_NAMES.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                activePrayer === key 
                  ? "bg-primary-foreground scale-125" 
                  : "bg-primary-foreground/30"
              )}
            />
            <span
              className={cn(
                "text-[10px] tracking-wide transition-all duration-300",
                activePrayer === key 
                  ? "font-semibold text-primary-foreground" 
                  : "text-primary-foreground/50"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};