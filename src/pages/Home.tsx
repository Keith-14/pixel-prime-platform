import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, MapPin, ChevronDown, Newspaper, Home as HomeIcon, ShoppingBasket, ScanLine, MessagesSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalLocation } from '@/contexts/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatAssistant } from '@/components/ChatAssistant';
import { SideMenu } from '@/components/SideMenu';
import prayerIcon from '@/assets/prayer-icon.png.asset.json';
import qaQuranAsset from '@/assets/qa-quran-new.png.asset.json';
import qaAiAsset from '@/assets/qa-ai-new.png.asset.json';
import qaPlacesAsset from '@/assets/qa-places-new.png.asset.json';
import qaHajjAsset from '@/assets/qa-hajj-new.png.asset.json';

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
    { label: 'Quran', img: qaQuranAsset.url, onClick: () => navigate('/quran') },
    { label: 'Islamic AI', img: qaAiAsset.url, onClick: () => setIsChatOpen(true) },
    { label: 'Places', img: qaPlacesAsset.url, onClick: () => navigate('/places') },
    { label: 'Hajj Packages', img: qaHajjAsset.url, onClick: () => navigate('/hajj') },
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
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
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
        <ArcTimeline
          hijri={hijri}
          currentPrayer={next[0]}
          prayerTime={prayerTime}
          nowMinutes={cur}
          prayerTimes={prayerTimes}
        />

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
      <BottomNav />

      {/* Chat overlay + side menu */}
      <ChatAssistant open={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
};

const PrayerIcon = ({ isActive }: { isActive: boolean }) => (
  <img
    src={prayerIcon.url}
    alt="Prayer"
    className="h-[22px] w-[22px] object-contain"
    style={{
      filter: isActive
        ? 'brightness(0) saturate(100%) invert(24%) sepia(50%) saturate(2000%) hue-rotate(350deg)'
        : 'none',
      opacity: isActive ? 1 : 0.6,
    }}
  />
);

const PILL_BG = '#FFFFFF';
const ACTIVE_BG = '#F5E3D3';
const TEXT_ACTIVE = '#7A3B1E';
const TEXT_INACTIVE = '#8A8A8A';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: HomeIcon, label: 'Home', path: '/' },
    { icon: ShoppingBasket, label: 'Marketplace', path: '/shop' },
    { label: 'Prayer', path: '/prayer-times', isImage: true },
    { icon: ScanLine, label: 'Halal Scan', path: '/halal-scanner' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 px-4 pb-4 font-arabic">
      <div className="flex items-center gap-3">
        {/* Main pill nav */}
        <div
          className="flex-1 rounded-full flex items-center justify-between py-2 px-2.5"
          style={{
            backgroundColor: PILL_BG,
            boxShadow: '0 8px 24px rgba(60, 30, 15, 0.12), 0 2px 6px rgba(60, 30, 15, 0.06)',
          }}
        >
          {navItems.map(({ icon: Icon, label, path, isImage }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-full transition-all duration-200 min-w-[64px]"
                style={{
                  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                }}
              >
                {isImage ? (
                  <PrayerIcon isActive={isActive} />
                ) : Icon && (
                  <Icon
                    className="h-[22px] w-[22px]"
                    style={{ color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE }}
                  />
                )}
                <span
                  className="text-[11px] font-semibold leading-none mt-0.5"
                  style={{ color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat / Guftagu button */}
        <button
          onClick={() => navigate('/forum')}
          className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 active:scale-95"
          style={{
            background: 'radial-gradient(circle at 30% 25%, #C9663A 0%, #8B3A18 70%, #5C2410 100%)',
            boxShadow: '0 8px 20px rgba(139, 58, 24, 0.45), inset 0 1px 2px rgba(255,255,255,0.25)',
          }}
          aria-label="Guftagu"
        >
          <MessagesSquare className="h-6 w-6 text-white" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
};

type ArcTimelineProps = {
  hijri: string;
  currentPrayer: string;
  prayerTime: string;
  nowMinutes: number;
  prayerTimes: Array<[string, number, number]>;
};

const ArcTimeline = ({
  hijri,
  currentPrayer,
  prayerTime,
  nowMinutes,
  prayerTimes,
}: ArcTimelineProps) => {
  const cx = 140;
  const cy = 200;
  const r = 130;
  // Angles spread from 180° (left) to 0° (right) for 5 prayers
  const dots = prayerTimes.map(([name, h, m], i) => {
    const angleDeg = 180 - (i * 180) / (prayerTimes.length - 1);
    const rad = (angleDeg * Math.PI) / 180;
    return {
      name,
      mins: h * 60 + m,
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  });

  // Determine active prayer: the most recent one whose time has passed; default to first
  let activeIdx = 0;
  for (let i = 0; i < dots.length; i++) {
    if (nowMinutes >= dots[i].mins) activeIdx = i;
  }
  // If before Fajr, highlight Isha (previous day's last)
  if (nowMinutes < dots[0].mins) activeIdx = dots.length - 1;

  return (
    <div className="relative h-[230px] mt-4">
      <svg
        className="absolute left-1/2 -translate-x-1/2 top-0"
        width="280"
        height="230"
        viewBox="0 0 280 230"
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
        className="absolute left-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-md z-10"
        style={{ top: -2 }}
      >
        <div className="relative flex items-center justify-center">
          <span
            className="text-[#A35334] text-[22px] leading-none"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}
          >
            B
          </span>
          <span
            className="absolute"
            style={{
              left: -5,
              top: '50%',
              width: 5,
              height: 5,
              background: '#8A9A3B',
              transform: 'translateY(-50%) rotate(45deg)',
            }}
          />
        </div>
      </div>

      {/* Date + prayer (centered inside the semicircle) */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: 95 }}>
        <p
          className="text-[15px] tracking-tight"
          style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 300 }}
        >
          {hijri}
        </p>
        <p
          className="text-white text-[30px] mt-2 tracking-tight leading-none"
          style={{ fontWeight: 300 }}
        >
          {currentPrayer} {prayerTime}
        </p>
      </div>
    </div>
  );
};
