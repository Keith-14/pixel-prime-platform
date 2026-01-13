import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Sunrise, Sun, SunDim, Sunset, Moon, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const prayerTimes = [
  { name: 'FAJR', time: '04:52', icon: Sunrise, label: 'DAWN PRAYER' },
  { name: 'DHUHR', time: '12:45', icon: Sun, label: 'MIDDAY PRAYER' },
  { name: 'MAGHRIB', time: '19:18', icon: Sunset, label: 'SUNSET PRAYER' },
  { name: 'ASR', time: '17:17', icon: SunDim, label: 'AFTERNOON PRAYER' },
  { name: "ISHA'A", time: '20:38', icon: Moon, label: 'NIGHT PRAYER' },
];

const prayerGuidelines = [
  {
    name: 'Fajr',
    icon: Sunrise,
    timeWindow: 'From dawn until just before sunrise',
    rakaat: [
      { type: 'Sunnah', count: 2, note: 'Muakkadah (Emphasized)' },
      { type: 'Fard', count: 2, note: 'Obligatory' },
    ],
    notes: 'The Fajr prayer marks the beginning of the day. It is recommended to pray it as early as possible after the adhan.',
  },
  {
    name: 'Dhuhr',
    icon: Sun,
    timeWindow: 'From sun passing its zenith until Asr time begins',
    rakaat: [
      { type: 'Sunnah', count: 4, note: 'Muakkadah (Before Fard)' },
      { type: 'Fard', count: 4, note: 'Obligatory' },
      { type: 'Sunnah', count: 2, note: 'Muakkadah (After Fard)' },
    ],
    notes: 'The midday prayer. On Fridays, Dhuhr is replaced by Jummah prayer for men, which consists of 2 Fard rakaat preceded by a sermon.',
  },
  {
    name: 'Maghrib',
    icon: Sunset,
    timeWindow: 'From sunset until twilight disappears',
    rakaat: [
      { type: 'Fard', count: 3, note: 'Obligatory' },
      { type: 'Sunnah', count: 2, note: 'Muakkadah (After Fard)' },
    ],
    notes: 'The sunset prayer. It should be prayed promptly after sunset and should not be delayed.',
  },
  {
    name: 'Asr',
    icon: SunDim,
    timeWindow: 'From when shadow equals object height until sunset',
    rakaat: [
      { type: 'Sunnah', count: 4, note: 'Ghair Muakkadah (Non-emphasized)' },
      { type: 'Fard', count: 4, note: 'Obligatory' },
    ],
    notes: 'The afternoon prayer. It is highly recommended to pray Asr before the sun starts to turn yellow.',
  },
  {
    name: "Isha'a",
    icon: Moon,
    timeWindow: 'From twilight disappearing until midnight (or before Fajr)',
    rakaat: [
      { type: 'Sunnah', count: 4, note: 'Ghair Muakkadah (Before Fard)' },
      { type: 'Fard', count: 4, note: 'Obligatory' },
      { type: 'Sunnah', count: 2, note: 'Muakkadah (After Fard)' },
      { type: 'Witr', count: 3, note: 'Wajib/Highly Emphasized' },
    ],
    notes: "The night prayer. Witr is prayed after Isha'a and can be delayed until before Fajr. It is the last prayer of the night.",
  },
];

export const PrayerTimes = () => {
  const [expandedGuideline, setExpandedGuideline] = useState<string | null>(null);

  const toggleGuideline = (name: string) => {
    setExpandedGuideline(expandedGuideline === name ? null : name);
  };

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Prayer Times</h1>
          <p className="text-sm text-muted-foreground">
            Imsak 04:52 | Sunrise 06:12
          </p>
        </div>

        {/* Prayer Time Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {prayerTimes.map(({ name, time, icon: Icon, label }) => (
            <Card
              key={name}
              className="bg-primary text-primary-foreground p-4 rounded-2xl text-center"
            >
              <Icon className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-2xl font-bold">{time}</p>
              <p className="text-xs opacity-90">{label}</p>
            </Card>
          ))}
        </div>

        {/* Prayer Guidelines Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">Prayer Guidelines</h2>
          </div>
          
          <div className="space-y-3">
            {prayerGuidelines.map((prayer) => {
              const Icon = prayer.icon;
              const isExpanded = expandedGuideline === prayer.name;
              
              return (
                <Card
                  key={prayer.name}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleGuideline(prayer.name)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-xl">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{prayer.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {prayer.rakaat.map(r => `${r.count} ${r.type}`).join(' • ')}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Time Window */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Time Window</p>
                        <p className="text-sm text-foreground">{prayer.timeWindow}</p>
                      </div>
                      
                      {/* Rakaat Breakdown */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Rakaat Breakdown</p>
                        <div className="space-y-2">
                          {prayer.rakaat.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${
                                  r.type === 'Fard' ? 'text-primary' : 
                                  r.type === 'Witr' ? 'text-amber-600' : 
                                  'text-muted-foreground'
                                }`}>
                                  {r.count}
                                </span>
                                <span className="text-sm font-medium text-foreground">{r.type}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">{r.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Additional Notes */}
                      <div className="bg-primary/5 rounded-lg p-3">
                        <p className="text-sm text-foreground leading-relaxed">{prayer.notes}</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          
          {/* General Guidelines Note */}
          <Card className="bg-muted/30 border border-border p-4 rounded-2xl">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              These guidelines follow general Sunni Islamic practices. For specific rulings, 
              please consult with a qualified Islamic scholar or your local imam.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
