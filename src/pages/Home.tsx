import { Layout } from '@/components/Layout';
import { PrayerOverviewCard } from '@/components/home/PrayerOverviewCard';
import { QuickActionsRow } from '@/components/home/QuickActionsRow';
import { DailyDuaCard } from '@/components/home/DailyDuaCard';
import { TodaysVerseCard } from '@/components/home/TodaysVerseCard';
import { IslamicNewsCard } from '@/components/home/IslamicNewsCard';
import {
  Clock,
  BookOpen,
  Calculator,
  Compass,
  Search,
  MapPin,
  BarChart3,
  Heart,
  Menu,
  Bell,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useGlobalLocation } from '@/contexts/LocationContext';

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, loading: locationLoading, error: locationError, refresh: refreshLocation } = useGlobalLocation();
  const [userName, setUserName] = useState<string>('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentPrayer, setCurrentPrayer] = useState({ name: '', nextTime: '' });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) {
        setUserName('');
        return;
      }

      const metaName = user.user_metadata?.full_name;
      if (metaName) {
        setUserName(metaName.split(' ')[0]);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0]);
      }
    };

    fetchUserName();
  }, [user]);

  const getCurrentPrayer = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const prayerTimes = {
      Fajr: { start: 5 * 60, end: 6 * 60 + 30 },
      Dhuhr: { start: 12 * 60 + 30, end: 15 * 60 },
      Asr: { start: 15 * 60, end: 18 * 60 },
      Maghrib: { start: 18 * 60, end: 19 * 60 + 30 },
      Isha: { start: 19 * 60 + 30, end: 23 * 60 },
    } as const;

    for (const [name, time] of Object.entries(prayerTimes)) {
      if (currentMinutes >= time.start && currentMinutes <= time.end) {
        const nextPrayerTime = time.end;
        const nextHours = Math.floor(nextPrayerTime / 60);
        const nextMins = nextPrayerTime % 60;
        return {
          name: `${name} Time`,
          nextTime: `Next prayer at ${nextHours.toString().padStart(2, '0')}:${nextMins
            .toString()
            .padStart(2, '0')}`,
        };
      }
    }

    const nextPrayerNames: Array<keyof typeof prayerTimes> = [
      'Fajr',
      'Dhuhr',
      'Asr',
      'Maghrib',
      'Isha',
    ];
    const nextPrayer =
      nextPrayerNames.find((name) => {
        const time = prayerTimes[name];
        return currentMinutes < time.start;
      }) || 'Fajr';

    const nextTime = prayerTimes[nextPrayer].start;
    const nextHours = Math.floor(nextTime / 60);
    const nextMins = nextTime % 60;

    return {
      name: `Next: ${nextPrayer}`,
      nextTime: `${nextHours.toString().padStart(2, '0')}:${nextMins
        .toString()
        .padStart(2, '0')}`,
    };
  };

  useEffect(() => {
    const now = new Date();
    const islamicDate = new Intl.DateTimeFormat('en-u-ca-islamic', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    setCurrentDate(islamicDate);
  }, []);

  useEffect(() => {
    const updateTimeAndPrayer = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(timeString);
      setCurrentPrayer(getCurrentPrayer());
    };

    updateTimeAndPrayer();
    const interval = setInterval(updateTimeAndPrayer, 1000);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { label: 'Qibla', Icon: Compass, onClick: () => navigate('/qibla') },
    { label: 'Quran', Icon: BookOpen, onClick: () => navigate('/quran') },
    { label: 'Track', Icon: BarChart3, onClick: () => navigate('/progress') },
    { label: 'Mood', Icon: Heart, onClick: () => navigate('/makkah-live') },
    { label: 'Prayer', Icon: Clock, onClick: () => navigate('/prayer-times') },
    { label: 'Zakat', Icon: Calculator, onClick: () => navigate('/zakat') },
    { label: 'Store', Icon: Search, onClick: () => navigate('/shop') },
    { label: 'Progress', Icon: MapPin, onClick: () => navigate('/progress') },
  ];

  const greeting = userName ? `As-Salaam-Alaikum, ${userName}` : 'As-Salaam-Alaikum';

  return (
    <Layout showHeader={false}>
      <div className="px-5 py-4 space-y-6">
        {/* Top controls */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground hover:bg-primary/10 rounded-xl h-10 w-10"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-foreground hover:bg-primary/10 rounded-xl h-10 w-10"
          >
            <Bell className="h-5 w-5" strokeWidth={2} />
          </Button>
        </div>

        {/* Welcome + Prayer overview */}
        <section className="space-y-5" aria-label="Welcome and prayer overview">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              {greeting}
            </p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Barakah Home</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" strokeWidth={2.5} />
              {locationLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Getting location...
                </span>
              ) : locationError ? (
                <button 
                  onClick={refreshLocation}
                  className="text-destructive hover:underline"
                >
                  {locationError} Tap to retry
                </button>
              ) : (
                <span className="line-clamp-1">{location?.city}, {location?.country}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{currentDate}</p>
          </div>

          <PrayerOverviewCard
            currentPrayerName={currentPrayer.name}
            currentTime={currentTime}
            nextTimeLabel={currentPrayer.nextTime}
          />
        </section>

        {/* All quick actions icons */}
        <section aria-label="Quick actions">
          <QuickActionsRow items={quickActions} />
        </section>

        {/* Islamic World News */}
        <section aria-label="Islamic news">
          <IslamicNewsCard />
        </section>

        {/* Daily Dua */}
        <section aria-label="Daily dua">
          <DailyDuaCard />
        </section>

        {/* Today's Verse */}
        <section aria-label="Today's verse">
          <TodaysVerseCard />
        </section>
      </div>

      {/* Side Menu - controlled from Home */}
      <div 
        className={`fixed inset-0 z-50 ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div className={`absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div 
          className={`absolute left-0 top-0 h-full w-80 bg-card shadow-2xl transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <SideMenuContent onClose={() => setIsMenuOpen(false)} />
        </div>
      </div>
    </Layout>
  );
};

// Inline side menu content
const SideMenuContent = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Prayer Times', path: '/prayer-times' },
    { label: 'Qibla', path: '/qibla' },
    { label: 'Quran', path: '/quran' },
    { label: 'Makkah Live', path: '/makkah-live' },
    { label: 'Zakat Calculator', path: '/zakat' },
    { label: 'Shop', path: '/shop' },
    { label: 'Progress', path: '/progress' },
    { label: 'Account', path: '/account' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 bg-primary text-primary-foreground">
        <h2 className="text-xl font-semibold tracking-tight">Barakah</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="hover:bg-primary-foreground/10 rounded-xl h-10 w-10 text-primary-foreground"
        >
          ✕
        </Button>
      </div>
      <nav className="flex-1 py-3 px-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            className="w-full text-left px-4 py-3.5 rounded-xl text-foreground hover:bg-primary/5 transition-colors duration-200 font-medium"
          >
            {item.label}
          </button>
        ))}
      </nav>
      {user && (
        <div className="px-3 pb-6">
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-3.5 rounded-xl text-destructive hover:bg-destructive/5 transition-colors duration-200 font-medium"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};