import { Layout } from '@/components/Layout';
import { FeatureCard } from '@/components/FeatureCard';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Clock, 
  BookOpen, 
  Calculator, 
  Compass, 
  Search,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("Getting location...");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentPrayer, setCurrentPrayer] = useState({ name: "", nextTime: "" });
  
  const getCurrentPrayer = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    // Approximate prayer times (can be made more accurate with proper calculation)
    const prayerTimes = {
      Fajr: { start: 5 * 60, end: 6 * 60 + 30 }, // 5:00 - 6:30
      Dhuhr: { start: 12 * 60 + 30, end: 15 * 60 }, // 12:30 - 15:00
      Asr: { start: 15 * 60, end: 18 * 60 }, // 15:00 - 18:00
      Maghrib: { start: 18 * 60, end: 19 * 60 + 30 }, // 18:00 - 19:30
      Isha: { start: 19 * 60 + 30, end: 23 * 60 } // 19:30 - 23:00
    };

    for (const [name, time] of Object.entries(prayerTimes)) {
      if (currentMinutes >= time.start && currentMinutes <= time.end) {
        const nextPrayerTime = time.end;
        const nextHours = Math.floor(nextPrayerTime / 60);
        const nextMins = nextPrayerTime % 60;
        return {
          name: `${name} Time`,
          nextTime: `Next prayer at ${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`
        };
      }
    }

    // If no current prayer time, show next prayer
    const nextPrayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const nextPrayer = nextPrayerNames.find(name => {
      const time = prayerTimes[name as keyof typeof prayerTimes];
      return currentMinutes < time.start;
    }) || 'Fajr';

    const nextTime = prayerTimes[nextPrayer as keyof typeof prayerTimes].start;
    const nextHours = Math.floor(nextTime / 60);
    const nextMins = nextTime % 60;

    return {
      name: `Next: ${nextPrayer}`,
      nextTime: `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`
    };
  };

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Get location name using reverse geocoding
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            setLocation(`${data.city || data.locality || 'Unknown'}, ${data.countryName || 'Unknown'}`);
          } catch (error) {
            setLocation("Location unavailable");
          }
        },
        () => {
          setLocation("Location access denied");
        }
      );
    }
    
    // Get current date and Islamic date
    const now = new Date();
    const islamicDate = new Intl.DateTimeFormat('en-u-ca-islamic', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(now);
    
    setCurrentDate(islamicDate);
  }, []);

  // Update time and prayer info every second
  useEffect(() => {
    const updateTimeAndPrayer = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
      setCurrentPrayer(getCurrentPrayer());
    };

    updateTimeAndPrayer(); // Initial call
    const interval = setInterval(updateTimeAndPrayer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search" 
            className="pl-10 bg-sage-light border-sage-light rounded-full"
          />
        </div>

        {/* Date Display */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-sage mb-2">HOME</h1>
          <div className="flex items-center justify-center space-x-2">
            <MapPin className="h-4 w-4 text-sage" />
            <span className="text-sm text-muted-foreground">{location}</span>
          </div>
          
          {/* Time and Prayer Info */}
          <div className="mt-3 space-y-2">
            <div className="text-2xl font-bold text-sage">{currentTime}</div>
            <div className="text-sm text-sage font-medium">{currentPrayer.name}</div>
            <div className="text-xs text-muted-foreground">{currentPrayer.nextTime}</div>
          </div>
          
          <p className="text-lg text-foreground mt-3">{currentDate}</p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            icon={Clock}
            title="PRAYER TIMES"
            subtitle="FIVE PRAYERS REMINDER"
            onClick={() => navigate('/prayer-times')}
          />
          <FeatureCard
            icon={BookOpen}
            title="QIBLA"
            subtitle="VIEW QIBLA DIRECTION"
            onClick={() => navigate('/qibla')}
          />
          <FeatureCard
            icon={Calculator}
            title="ZAKAT"
            subtitle="ZAKAT CALCULATOR"
            onClick={() => navigate('/zakat')}
          />
          <FeatureCard
            icon={Compass}
            title="MAKKAH"
            subtitle="WATCH MAKKAH LIVE"
            onClick={() => navigate('/makkah-live')}
          />
          <FeatureCard
            icon={Search}
            title="ISLAMIC STORE"
            subtitle="SHOP ISLAMIC ITEMS"
            onClick={() => navigate('/shop')}
          />
          <FeatureCard
            icon={MapPin}
            title="SALAH TRACKER"
            subtitle="MY PROGRESS"
            onClick={() => navigate('/progress')}
          />
        </div>

        {/* Daily Hadith */}
        <Card className="bg-card p-4 rounded-2xl">
          <h3 className="text-lg font-semibold text-sage mb-3">DAILY HADITH</h3>
          <div className="space-y-2">
            <p className="text-sm text-foreground italic">
              "The believer is not one who eats his fill while his neighbour goes hungry."
            </p>
            <p className="text-xs text-muted-foreground text-right">
              —Sahih Bukhari
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};