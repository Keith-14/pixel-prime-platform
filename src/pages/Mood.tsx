import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Frown, Meh, Smile, Heart, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type MoodLevel = 1 | 2 | 3 | 4 | 5;

interface MoodOption {
  level: MoodLevel;
  labelKey: string;
  icon: typeof Frown;
  color: string;
  bgGradient: string;
}

interface Quote {
  text: string;
  source: string;
}

const moodOptions: MoodOption[] = [
  { 
    level: 1, 
    labelKey: 'mood.very_low', 
    icon: Frown, 
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-red-500/5'
  },
  { 
    level: 2, 
    labelKey: 'mood.low', 
    icon: Frown, 
    color: 'text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-500/5'
  },
  { 
    level: 3, 
    labelKey: 'mood.neutral', 
    icon: Meh, 
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-yellow-500/5'
  },
  { 
    level: 4, 
    labelKey: 'mood.good', 
    icon: Smile, 
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-500/5'
  },
  { 
    level: 5, 
    labelKey: 'mood.excellent', 
    icon: Heart, 
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-primary/5'
  },
];

// Quotes organized by mood level
const quotesByMood: Record<MoodLevel, Quote[]> = {
  1: [
    { text: "Verily, with hardship comes ease.", source: "Quran 94:6" },
    { text: "Allah does not burden a soul beyond that it can bear.", source: "Quran 2:286" },
    { text: "So truly where there is hardship there is also ease.", source: "Quran 94:5" },
    { text: "And He found you lost and guided you.", source: "Quran 93:7" },
    { text: "Indeed, Allah is with the patient.", source: "Quran 2:153" },
  ],
  2: [
    { text: "Perhaps you hate a thing and it is good for you.", source: "Quran 2:216" },
    { text: "Do not lose hope, nor be sad.", source: "Quran 3:139" },
    { text: "Whoever puts his trust in Allah, He will be enough for him.", source: "Quran 65:3" },
    { text: "After hardship, Allah will bring ease.", source: "Prophet Muhammad ﷺ" },
    { text: "The heart that turns to Allah finds peace.", source: "Islamic Wisdom" },
  ],
  3: [
    { text: "Be grateful and Allah will increase you.", source: "Quran 14:7" },
    { text: "Remember Me, and I will remember you.", source: "Quran 2:152" },
    { text: "The best among you are those who have the best character.", source: "Prophet Muhammad ﷺ" },
    { text: "A moment of patience in a moment of anger saves a thousand moments of regret.", source: "Islamic Wisdom" },
    { text: "Seek knowledge from the cradle to the grave.", source: "Prophet Muhammad ﷺ" },
  ],
  4: [
    { text: "Verily, in the remembrance of Allah do hearts find rest.", source: "Quran 13:28" },
    { text: "Spread love and kindness wherever you go.", source: "Prophet Muhammad ﷺ" },
    { text: "The strong is not the one who overcomes people, but the one who controls himself when angry.", source: "Prophet Muhammad ﷺ" },
    { text: "A good word is charity.", source: "Prophet Muhammad ﷺ" },
    { text: "Smile, it is charity.", source: "Prophet Muhammad ﷺ" },
  ],
  5: [
    { text: "My mercy encompasses all things.", source: "Quran 7:156" },
    { text: "Allah loves those who are thankful.", source: "Islamic Teaching" },
    { text: "He who thanks Allah for blessings will never be deprived of them.", source: "Islamic Wisdom" },
    { text: "Paradise lies at the feet of your mother.", source: "Prophet Muhammad ﷺ" },
    { text: "The world is but a moment, so spend it in obedience.", source: "Islamic Wisdom" },
  ],
};

export const Mood = () => {
  const { t } = useLanguage();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  const handleMoodSelect = (level: MoodLevel) => {
    setSelectedMood(level);
    const quotes = quotesByMood[level];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  };

  const handleNewQuote = () => {
    if (selectedMood) {
      const quotes = quotesByMood[selectedMood];
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setCurrentQuote(randomQuote);
    }
  };

  const handleReset = () => {
    setSelectedMood(null);
    setCurrentQuote(null);
  };

  const selectedMoodOption = moodOptions.find(m => m.level === selectedMood);

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6 font-arabic min-h-[calc(100vh-200px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <Heart className="h-8 w-8 text-primary relative z-10" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-emerald-gradient">{t('mood.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('mood.subtitle')}</p>
          </div>
          <Sparkles className="h-5 w-5 text-primary/60 ml-auto animate-pulse" />
        </div>

        {!selectedMood ? (
          /* Mood Selection */
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-center text-muted-foreground mb-8">{t('mood.how_feeling')}</p>
            
            <div className="grid grid-cols-5 gap-3">
              {moodOptions.map((mood, index) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.level}
                    onClick={() => handleMoodSelect(mood.level)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl glass-dark transition-all duration-300",
                      "hover:scale-105 active:scale-95 group",
                      "animate-in fade-in slide-in-from-bottom-2"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300",
                      `bg-gradient-to-br ${mood.bgGradient}`,
                      "group-hover:scale-110"
                    )}>
                      <Icon className={cn("h-6 w-6", mood.color)} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center font-medium">
                      {t(mood.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mood Scale Indicator */}
            <div className="flex justify-center items-center gap-2 mt-8 text-xs text-muted-foreground">
              <span>{t('mood.scale_low')}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1.5 w-6 rounded-full",
                      i <= 2 ? "bg-red-500/30" : i === 3 ? "bg-yellow-500/30" : "bg-emerald-500/30"
                    )}
                  />
                ))}
              </div>
              <span>{t('mood.scale_high')}</span>
            </div>
          </div>
        ) : (
          /* Quote Display */
          <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
            {/* Selected Mood Display */}
            <div className="flex justify-center mb-6">
              {selectedMoodOption && (
                <div className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center",
                  `bg-gradient-to-br ${selectedMoodOption.bgGradient}`,
                  "shadow-lg"
                )}>
                  <selectedMoodOption.icon 
                    className={cn("h-10 w-10", selectedMoodOption.color)} 
                    strokeWidth={1.5} 
                  />
                </div>
              )}
            </div>

            {/* Quote Card */}
            <Card className="relative overflow-hidden glass-dark p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,hsl(145_70%_45%/0.1),transparent_60%)] pointer-events-none" />
              
              <div className="relative z-10">
                <p className="text-lg font-medium text-foreground leading-relaxed mb-4 italic">
                  "{currentQuote?.text}"
                </p>
                <p className="text-sm text-primary font-semibold">
                  — {currentQuote?.source}
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground hover:bg-primary/8 rounded-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('mood.try_again')}
              </Button>
              <Button
                onClick={handleNewQuote}
                className="bg-primary/15 text-primary hover:bg-primary/25 rounded-full border border-primary/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('mood.new_quote')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
