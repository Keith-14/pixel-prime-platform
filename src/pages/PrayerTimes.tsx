import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Sun, Moon, Sunset, Star } from 'lucide-react';

const prayerTimes = [
  { name: 'FAJR', time: '04:52', icon: Star, label: 'BEFORE SUNRISE' },
  { name: 'DHUHR', time: '12:45', icon: Sun, label: 'AFTERNOON PRAYER' },
  { name: 'ASR', time: '17:17', icon: Sunset, label: 'EVENING PRAYER' },
  { name: 'MAGHRIB', time: '19:18', icon: Sunset, label: 'SUNSET PRAYER' },
  { name: "ISHA'A", time: '20:38', icon: Moon, label: 'NIGHT PRAYER' },
];

export const PrayerTimes = () => {
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

        {/* Prayer Guidelines */}
        <Card className="bg-primary text-primary-foreground p-4 rounded-2xl text-center">
          <Moon className="h-8 w-8 mx-auto mb-2" />
          <h3 className="font-bold">PRAYER GUIDELINES</h3>
        </Card>
      </div>
    </Layout>
  );
};
