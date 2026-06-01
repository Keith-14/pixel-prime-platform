import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, MapPin, ChevronDown, Newspaper, Home as HomeIcon, ShoppingBag, ScanLine, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalLocation } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatAssistant } from '@/components/ChatAssistant';
import { SideMenu } from '@/components/SideMenu';
import qaQuran from '@/assets/qa-quran.png';
import qaAi from '@/assets/qa-ai.png';
import qaPlaces from '@/assets/qa-places.png';
import qaHajj from '@/assets/qa-hajj.png';

interface NewsItem {
  id: string;
  title: string;
  source_name: string;
  category?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=200&h=200&fit=crop';

const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useGlobalLocation();
  const [userName, setUserName] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const display = user.displayName;
    if (display) {
      setUserName(display.split(' ')[0]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.uid)
        .single();
      if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, source_name, category, image_url, published_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(4);
      if (data) setNews(data as NewsItem[]);
    })();
  }, []);

  // Islamic (Hijri) date
  const hijri = new Intl.DateTimeFormat('en-u-ca-islamic', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(now)
    .replace(' AH', '');

  // Next prayer
  const prayerTimes: Array<[string, number, number]> = [
    ['Fajr', 5, 12],
    ['Dhuhr', 12, 30],
    ['Asr', 15, 45],
    ['Maghrib', 18, 38],
    ['Isha', 19, 55],
  ];
  const cur = now.getHours() * 60 + now.getMinutes();
  const next =
    prayerTimes.find(([, h, m]) => h * 60 + m > cur) || prayerTimes[0];
  const nextHour = next[1];
  const nextMin = next[2];
  const ampm = nextHour >= 12 ? 'pm' : 'am';
  const displayHour = ((nextHour + 11) % 12) + 1;
  const prayerTime = `${displayHour}:${nextMin.toString().padStart(2, '0')} ${ampm}`;

  const cityLabel = location?.city || 'Dubai';

  const quickActions = [
    { label: 'Quran', img: qaQuran, onClick: () => navigate('/quran') },
    { label: 'Islamic AI', img: qaAi, onClick: () => setIsChatOpen(true) },
    { label: 'Places', img: qaPlaces, onClick: () => navigate('/places') },
    { label: 'Hajj Packages', img: qaHajj, onClick: () => navigate('/hajj') },
  ];

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFE4B9 0%, #FFF5E5 32.66%)' }}
    >
      {/* HERO — brown gradient top section */}
      <div
        className="relative pt-4 pb-10 overflow-hidden"
        style={{ background: 'linear-gradient(177deg, #78351A 2.14%, #CE5728 97.86%)' }}
      >
        {/* soft radial glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 596,
            height: 299,
            left: -173,
            top: 241,
            background:
              'radial-gradient(42% 42% at 50% 50%, #D79354 0%, rgba(150,80,42,0) 70%)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 596,
            height: 299,
            left: 8,
            top: 243,
            background:
              'radial-gradient(42% 42% at 50% 50%, #D79354 0%, rgba(150,80,42,0) 70%)',
          }}
        />

        {/* Top app bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-[#F9FAFB] p-2 -ml-2"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <h1
            className="text-[#FFE8CA] text-[22px] tracking-wide"
            style={{ fontFamily: 'Reem Kufi, sans-serif', fontWeight: 600 }}
          >
            Barakah
          </h1>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#F9FAFB]"
            style={{ background: 'rgba(255,255,255,0.15)' }}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Greeting + location */}
        <div className="relative z-10 px-5 pt-5 flex items-start justify-between">
          <div>
            <p className="text-[12px] font-medium" style={{ color: '#E8D5C4', opacity: 0.85 }}>
              As-Salaam-Alaikum!
            </p>
            <p className="text-[18px] font-bold mt-0.5" style={{ color: '#E8D5C4' }}>
              {userName || 'Friend'}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/70 text-[#F9FAFB]">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[12px] font-medium">{cityLabel}</span>
            <ChevronDown className="h-3 w-3" strokeWidth={2} />
          </div>
        </div>

        {/* Arc + center logo + prayer info */}
        <div className="relative h-[200px] mt-4">
          {/* Arc */}
          <svg
            className="absolute left-1/2 -translate-x-1/2 top-0"
            width="280"
            height="200"
            viewBox="0 0 280 200"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 200 A130 130 0 0 1 270 200"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
              fill="none"
            />
          </svg>
          {/* B logo at top of arc */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md"
            style={{ top: -2 }}
          >
            <span
              className="text-[#A35334] text-[18px]"
              style={{ fontFamily: 'Reem Kufi, sans-serif', fontWeight: 700 }}
            >
              B
            </span>
          </div>

          {/* Date + prayer */}
          <div className="relative z-10 flex flex-col items-center pt-14">
            <p
              className="text-[16px] tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 300 }}
            >
              {hijri}
            </p>
            <p
              className="text-white text-[26px] mt-1 tracking-tight"
              style={{ fontWeight: 300 }}
            >
              {next[0]} {prayerTime}
            </p>
          </div>
        </div>

        {/* Quick action cards */}
        <div className="relative z-10 px-5 mt-2 grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="flex flex-col items-center justify-end pt-2 pb-2.5 rounded-2xl border transition-transform active:scale-95"
              style={{
                background: '#FFF5E5',
                borderColor: 'rgba(232,213,196,0.86)',
                height: 90,
              }}
            >
              <img src={a.img} alt={a.label} className="h-12 w-auto object-contain" />
              <span
                className="text-[10px] mt-1"
                style={{ color: '#55433D', fontWeight: 500 }}
              >
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CREAM SHEET — News */}
      <div
        className="relative -mt-6 rounded-t-[24px] border-2 border-b-0 px-5 pt-5 pb-40"
        style={{ background: '#FFF5E5', borderColor: '#E8D5C4' }}
      >
        {/* drag handle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 80, height: 3, top: 8, background: '#D9D9D9' }}
        />

        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" style={{ color: '#C4733A' }} strokeWidth={2} />
            <h2
              className="text-[18px]"
              style={{ color: '#2C1309', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}
            >
              News
            </h2>
          </div>
          <button
            onClick={() => navigate('/news')}
            className="text-[12px] font-medium"
            style={{ color: '#5F5A4F' }}
          >
            View More
          </button>
        </div>

        <div className="space-y-2.5">
          {(news.length ? news : Array.from({ length: 2 })).map((n: any, i) => (
            <button
              key={n?.id || i}
              onClick={() => n?.id && navigate(`/news/${n.id}`)}
              className="w-full text-left rounded-2xl border p-3 flex items-start gap-3 transition-transform active:scale-[0.99]"
              style={{
                background: 'rgba(255,255,255,0.65)',
                borderColor: '#E8D5C4',
                backdropFilter: 'blur(4px)',
              }}
            >
              <img
                src={n?.image_url || FALLBACK_IMG}
                alt=""
                loading="lazy"
                className="w-20 h-20 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.05em]"
                  style={{ color: '#5C1F05' }}
                >
                  {n?.category || 'Culture'}
                </p>
                <p
                  className="text-[13px] mt-1 line-clamp-2"
                  style={{
                    color: '#2C1309',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 600,
                    lineHeight: '18px',
                  }}
                >
                  {n?.title ||
                    "New calligraphy exhibition opens in Istanbul's historic center"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium" style={{ color: '#B8622A' }}>
                    {n?.source_name || 'TRT World'}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: 'rgba(184,98,42,0.4)' }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: '#B8622A' }}>
                    {timeAgo(n?.published_at) || '2h ago'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="fixed left-1/2 -translate-x-1/2 max-w-md w-full pointer-events-none"
        style={{
          bottom: 0,
          height: 140,
          background:
            'linear-gradient(0deg, #FFF5E5 30%, rgba(255,245,229,0) 100%)',
        }}
      />

      {/* Bottom nav */}
      <BottomNav onChat={() => setIsChatOpen(true)} />

      {/* Chat overlay + side menu */}
      <ChatAssistant open={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

const BottomNav = ({ onChat }: { onChat: () => void }) => {
  const navigate = useNavigate();
  const items = [
    { label: 'Home', Icon: HomeIcon, path: '/', active: true },
    { label: 'Marketplace', Icon: ShoppingBag, path: '/shop' },
    { label: 'Prayer', Icon: () => <PrayerIcon />, path: '/prayer-times' },
    { label: 'Halal Scan', Icon: ScanLine, path: '/halal-scanner' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 max-w-md w-full px-5 z-30">
      <div className="flex items-center gap-2">
        <nav
          className="flex-1 flex items-center justify-between px-2 py-2 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.75)',
            boxShadow:
              '0 2px 30px rgba(0,0,0,0.05), 0 8px 30px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {items.map(({ label, Icon, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center rounded-full px-3 py-1.5 min-w-[60px]"
              style={
                active
                  ? { background: 'rgba(133,59,30,0.10)' }
                  : undefined
              }
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.2 : 1.6}
                color={active ? '#7A3D26' : '#8F8F8F'}
              />
              <span
                className="text-[10px] mt-0.5"
                style={{
                  color: active ? '#7A3D26' : 'rgba(0,0,0,0.5)',
                  fontWeight: active ? 700 : 600,
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </nav>
        <button
          onClick={onChat}
          aria-label="Chat"
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(180deg, #5A2611 0%, #C94E1D 100%)',
            boxShadow:
              '0 8px 24px rgba(90,38,17,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

const PrayerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3v2M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 7.7l1.4-1.4"
      stroke="#8F8F8F"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M6 21V13a6 6 0 0112 0v8"
      stroke="#8F8F8F"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M4 21h16" stroke="#8F8F8F" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);