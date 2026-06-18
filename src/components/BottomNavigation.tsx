import { Home as HomeIcon, ShoppingBasket, ScanLine, MessageSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const PILL_BG = '#FFFFFF';
const ACTIVE_BG = '#F5E3D3';
const TEXT_ACTIVE = '#7A3B1E';
const TEXT_INACTIVE = '#9A9A9A';

// Inline mosque icon matching screenshot (dome + crescent)
const MosqueIcon = ({ color, size = 26 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* crescent */}
    <path
      d="M16 3.2c.9.6 1.5 1.6 1.5 2.8 0 1.8-1.5 3.3-3.3 3.3-.4 0-.7 0-1-.1.6 1 1.7 1.7 3 1.7 1.9 0 3.5-1.6 3.5-3.5 0-1.9-1.6-3.5-3.5-3.5-.1 0-.2 0-.2.3z"
      fill={color}
    />
    {/* dome */}
    <path
      d="M8 18c0-4.4 3.6-8 8-8s8 3.6 8 8v2H8v-2z"
      fill={color}
    />
    {/* base */}
    <rect x="7" y="20" width="18" height="8" rx="1" fill={color} />
    {/* door */}
    <path d="M14 23h4v5h-4z" fill={PILL_BG} />
  </svg>
);

type NavItem = {
  key: string;
  labelKey: string;
  path: string;
  render: (color: string) => JSX.Element;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', labelKey: 'nav.home', path: '/', render: (c) => <HomeIcon size={24} color={c} strokeWidth={2} /> },
  { key: 'shop', labelKey: 'nav.store', path: '/shop', render: (c) => <ShoppingBasket size={24} color={c} strokeWidth={1.8} /> },
  { key: 'prayer', labelKey: 'nav.prayer', path: '/prayer-times', render: (c) => <MosqueIcon color={c} size={26} /> },
  { key: 'scan', labelKey: 'nav.halalScan', path: '/halal-scanner', render: (c) => <ScanLine size={24} color={c} strokeWidth={1.8} /> },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 px-4 pb-4 font-arabic">
      <div className="flex items-center gap-3">
        <div
          className="flex-1 rounded-full flex items-center justify-between py-1.5 px-2"
          style={{
            backgroundColor: PILL_BG,
            boxShadow: '0 10px 28px rgba(60, 30, 15, 0.14), 0 2px 6px rgba(60, 30, 15, 0.06)',
          }}
        >
          {NAV_ITEMS.map(({ key, labelKey, path, render }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            const color = isActive ? TEXT_ACTIVE : TEXT_INACTIVE;
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-full transition-all duration-200"
                style={{ backgroundColor: isActive ? ACTIVE_BG : 'transparent' }}
              >
                {render(color)}
                <span
                  className="text-[12px] leading-none"
                  style={{ color, fontWeight: isActive ? 700 : 600 }}
                >
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat / Guftagu FAB */}
        <button
          onClick={() => navigate('/forum')}
          className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 active:scale-95"
          style={{
            background: 'radial-gradient(circle at 30% 25%, #C9663A 0%, #8B3A18 70%, #5C2410 100%)',
            boxShadow: '0 8px 20px rgba(139, 58, 24, 0.45), inset 0 1px 2px rgba(255,255,255,0.25)',
          }}
          aria-label="Guftagu"
        >
          <MessageSquare className="h-6 w-6 text-white" strokeWidth={2.2} fill="white" />
        </button>
      </div>
    </nav>
  );
};
