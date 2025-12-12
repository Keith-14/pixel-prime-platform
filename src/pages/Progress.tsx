import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { useState } from 'react';

const prayers = [
  { name: 'FAJR', time: '04:52', completed: false },
  { name: 'DHUHR', time: '12:45', completed: false },
  { name: 'ASR', time: '17:17', completed: false },
  { name: 'MAGHRIB', time: '19:18', completed: false },
  { name: "ISHA'A", time: '20:38', completed: false },
];

export const Progress = () => {
  const [prayerStatus, setPrayerStatus] = useState(prayers);
  const [dayStreak, setDayStreak] = useState(0);
  
  const completedPrayers = prayerStatus.filter(p => p.completed).length;
  const progressPercentage = Math.round((completedPrayers / prayerStatus.length) * 100);

  const markPrayerDone = (index: number) => {
    const updated = [...prayerStatus];
    updated[index].completed = !updated[index].completed;
    setPrayerStatus(updated);
  };

  return (
    <Layout>
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-primary">Your Progress</h1>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary text-primary-foreground p-4 rounded-2xl text-center">
            <h3 className="font-bold text-lg">{dayStreak}</h3>
            <p className="text-sm opacity-90">DAY STREAK</p>
          </Card>
          <Card className="bg-primary text-primary-foreground p-4 rounded-2xl text-center">
            <h3 className="font-bold text-lg">{progressPercentage}%</h3>
            <p className="text-sm opacity-90">TODAY'S PROGRESS</p>
          </Card>
        </div>

        {/* Prayer Checklist */}
        <div className="space-y-3">
          {prayerStatus.map((prayer, index) => (
            <Card key={prayer.name} className="p-4 rounded-2xl bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {prayer.name}
                  </div>
                  <span className="text-lg font-bold text-foreground">{prayer.time}</span>
                </div>
                <Button
                  variant={prayer.completed ? "default" : "outline"}
                  onClick={() => markPrayerDone(index)}
                  className={`rounded-full ${
                    prayer.completed 
                      ? "bg-primary text-primary-foreground" 
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {prayer.completed ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      DONE
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4 mr-2" />
                      MARK AS DONE
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
