import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, MapPin, ChevronDown, Sun, Sunrise, Sunset, Moon, Cloud, CloudSun, Sparkles, Compass, CheckCircle2, Package } from 'lucide-react';
import { SideMenu } from '@/components/SideMenu';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useGlobalLocation } from '@/contexts/LocationContext';
import prayerArcLogo from '@/assets/prayer-arc-logo.png.asset.json';
import hadithIcon from '@/assets/hadith-icon.png.asset.json';
import quranIcon from '@/assets/quran-icon.png.asset.json';
import hajjIcon from '@/assets/hajj-icon.png.asset.json';
import placesIcon from '@/assets/places-icon.png.asset.json';
import zakatIcon from '@/assets/zakat-icon.png.asset.json';
import moodTrackerIcon from '@/assets/mood-tracker-icon.png.asset.json';

const CREAM = '#FFF1DD';
const CREAM_CARD = '#FFF7E8';
const BROWN = '#2C1309';
const BROWN_ACCENT = '#B0431E';
const HERO_GRAD = 'linear-gradient(177deg, #78351A 2.14%, #CE5728 97.86%)';
const DAILY_GREEN = '#3F5A2E';

type PrayerKey = 'sunrise' | 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const PRAYERS: { key: PrayerKey; label: string; h: number; m: number; icon: any }[] = [
  { key: 'sunrise', label: 'Sunrise', h: 5, m: 48, icon: Sun },
  { key: 'fajr', label: 'Fajr', h: 4, m: 52, icon: CloudSun },
  { key: 'dhuhr', label: 'Dhuhr', h: 12, m: 45, icon: Sun },
  { key: 'asr', label: 'Asr', h: 15, m: 47, icon: Cloud },
  { key: 'maghrib', label: 'Maghrib', h: 18, m: 38, icon: Sunset },
  { key: 'isha', label: 'Isha', h: 19, m: 55, icon: Moon },
];

const fmt = (h: number, m: number) =>
  `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

const fmt12 = (h: number, m: number) => {
  const ampm = h >= 12 ? 'pm' : 'am';
  const dh = ((h + 11) % 12) + 1;
  return `${dh}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const essentials = [
  { label: 'Hadith', img: hadithIcon.url, icon: null, path: '/quran' },
  { label: 'Quran', img: quranIcon.url, icon: null, path: '/quran' },
  { label: 'Hajj Packages', img: hajjIcon.url, icon: null, path: '/hajj' },
  { label: 'Places', img: placesIcon.url, icon: null, path: '/places' },
  { label: 'Zakat Calc.', img: zakatIcon.url, icon: null, path: '/zakat' },
  { label: 'Mood Tracker', img: moodTrackerIcon.url, icon: null, path: '/mood' },
  { label: 'Qibla', img: null, icon: Compass, path: '/qibla' },
  { label: 'Prayer Mark', img: null, icon: CheckCircle2, path: '/progress' },
];


export const PrayerTimes = () => {
  const navigate = useNavigate();
  const { location } = useGlobalLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const hijri = useMemo(
    () =>
      new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
        .format(now)
        .replace(' AH', ''),
    [now]
  );

  const cur = now.getHours() * 60 + now.getMinutes();
  const orderedDay = PRAYERS.filter((p) => p.key !== 'sunrise');
  const next =
    orderedDay.find((p) => p.h * 60 + p.m > cur) || orderedDay[0];
  const cityLabel = location?.city || 'Dubai';

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden font-arabic"
      style={{ background: CREAM }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ background: CREAM }}>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2"
          style={{ color: BROWN }}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
        <h1
          className="text-[20px] font-bold"
          style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Prayers
        </h1>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{ background: '#F1E0C8', color: BROWN }}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#E89D2F' }} />
        </button>
      </div>

      {/* Hero arc card */}
      <div
        className="relative mx-0 px-5 pt-6 pb-10 overflow-hidden"
        style={{ background: HERO_GRAD, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
      >
        {/* Arc + Logo image */}
        <div className="absolute inset-x-0 top-3 flex justify-center">
          <img
            src={prayerArcLogo.url}
            alt="Barakah"
            className="w-full max-w-[300px] object-contain"
            style={{ height: 150 }}
          />
        </div>

        <div className="relative z-10 text-center mt-8">
          <p className="text-[14px]" style={{ color: '#FFE8CA', opacity: 0.9 }}>
            {hijri}
          </p>
          <p
            className="text-[28px] mt-2"
            style={{ color: '#FFF5E5', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500 }}
          >
            {next.label} {fmt12(next.h, next.m)}
          </p>
        </div>
      </div>

      {/* Essentials grid */}
      <div className="px-5 pt-6">
        <h2
          className="text-[20px] mb-3"
          style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
        >
          Essentials
        </h2>
        <div className="grid grid-cols-4 gap-2.5">
          {essentials.map((e) => (
            <button
              key={e.label}
              onClick={() => navigate(e.path)}
              className="flex flex-col items-center justify-end pt-2 pb-2 rounded-2xl border transition-transform active:scale-95"
              style={{
                background: CREAM_CARD,
                borderColor: 'rgba(232,213,196,0.86)',
                height: 88,
              }}
            >
              {e.img ? (
                <img src={e.img} alt={e.label} className="h-11 w-auto object-contain" />
              ) : (
                <div
                  className="h-11 w-11 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(180deg, #C99063 0%, #8B4A22 100%)', color: '#FFF1DD' }}
                >
                  {e.icon && <e.icon className="h-5 w-5" strokeWidth={2} />}
                </div>
              )}
              <span className="text-[10px] mt-1.5 text-center px-1" style={{ color: BROWN, fontWeight: 600 }}>
                {e.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Prayer Times */}
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-[20px]"
            style={{ color: BROWN, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
          >
            Daily Prayer Times
          </h2>
          <button className="flex items-center gap-1 text-[13px]" style={{ color: BROWN }}>
            <MapPin className="h-4 w-4" strokeWidth={2} />
            <span className="font-medium">{cityLabel}</span>
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-2.5">
          {PRAYERS.map((p) => {
            const isActive = p.key === next.key;
            const isSunrise = p.key === 'sunrise';
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                className="flex items-center justify-between rounded-2xl px-5 py-3.5 border"
                style={{
                  background: CREAM_CARD,
                  borderColor: isActive ? BROWN_ACCENT : 'rgba(232,213,196,0.7)',
                  borderWidth: isActive ? 1.5 : 1,
                }}
              >
                <span
                  className="text-[18px]"
                  style={{
                    color: BROWN,
                    fontWeight: 600,
                    fontStyle: isSunrise ? 'italic' : 'normal',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {p.label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[16px] tabular-nums" style={{ color: BROWN, fontWeight: 500 }}>
                    {fmt(p.h, p.m)}
                  </span>
                  <Icon className="h-5 w-5" style={{ color: BROWN }} strokeWidth={2} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Wisdom */}
      <div className="px-5 pt-5 pb-32">
        <div className="rounded-2xl p-5" style={{ background: DAILY_GREEN }}>
          <div className="flex items-start justify-between">
            <Sparkles className="h-7 w-7" style={{ color: '#D4E5A8' }} strokeWidth={1.5} />
            <span
              className="text-[11px] tracking-[0.15em]"
              style={{ color: '#E8F0D0', fontWeight: 600 }}
            >
              DAILY WISDOM
            </span>
          </div>
          <p
            className="mt-4 text-[18px] italic leading-snug"
            style={{ color: '#FFF5E5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            "For indeed, with hardship [will be] ease."
          </p>
          <p
            className="mt-3 text-[11px] tracking-[0.15em]"
            style={{ color: '#C9D4A8', fontWeight: 700 }}
          >
            ASH-SHARH 94:5
          </p>
        </div>
      </div>

      <BottomNavigation />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};
