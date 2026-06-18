import { ScanLine, MessagesSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import navHomeIcon from '@/assets/nav-home-icon.png.asset.json';
import navMarketplaceIcon from '@/assets/nav-marketplace-icon.png.asset.json';
import navPrayerIcon from '@/assets/nav-prayer-icon.png.asset.json';

const HomeIconImg = ({ isActive }: { isActive: boolean }) => (
  <img
    src={navHomeIcon.url}
    alt="Home"
    className="h-[32px] w-auto object-contain"
    style={{ opacity: isActive ? 1 : 0.6 }}
  />
);

const MarketplaceIconImg = ({ isActive }: { isActive: boolean }) => (
  <img
    src={navMarketplaceIcon.url}
    alt="Marketplace"
    className="h-[32px] w-auto object-contain"
    style={{ opacity: isActive ? 1 : 0.6 }}
  />
);

const PrayerIconImg = ({ isActive }: { isActive: boolean }) => (
  <img
    src={navPrayerIcon.url}
    alt="Prayer"
    className="h-[32px] w-auto object-contain"
    style={{ opacity: isActive ? 1 : 0.6 }}
  />
);

const PILL_BG = '#FFFFFF';
const ACTIVE_BG = '#F5E3D3';
const TEXT_ACTIVE = '#7A3B1E';
const TEXT_INACTIVE = '#8A8A8A';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { labelKey: 'nav.home', path: '/', isHomeImage: true },
    { labelKey: 'nav.store', path: '/shop', isMarketplaceImage: true },
    { labelKey: 'nav.prayer', path: '/prayer-times', isPrayerImage: true },
    { icon: ScanLine, labelKey: 'nav.halalScan', path: '/halal-scanner' },
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
          {navItems.map(({ icon: Icon, labelKey, path, isHomeImage, isMarketplaceImage, isPrayerImage }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-full transition-all duration-200 min-w-[64px]"
                )}
                style={{
                  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                }}
              >
                {isHomeImage ? (
                  <HomeIconImg isActive={isActive} />
                ) : isMarketplaceImage ? (
                  <MarketplaceIconImg isActive={isActive} />
                ) : isPrayerImage ? (
                  <PrayerIconImg isActive={isActive} />
                ) : Icon && (
                  <Icon
                    className="h-[22px] w-[22px]"
                    style={{ color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE }}
                  />
                )}
                {!isHomeImage && !isMarketplaceImage && !isPrayerImage && (
                  <span
                    className="text-[11px] font-semibold leading-none mt-0.5"
                    style={{ color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE }}
                  >
                    {t(labelKey)}
                  </span>
                )}
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
