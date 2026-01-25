import { Home, ShoppingBag, Users, MapPin, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, labelKey: 'nav.home', path: '/' },
    { icon: ShoppingBag, labelKey: 'nav.store', path: '/shop' },
    { icon: Users, labelKey: 'nav.guftagu', path: '/forum' },
    { icon: MapPin, labelKey: 'nav.places', path: '/places' },
    { icon: User, labelKey: 'nav.account', path: '/account' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 px-4 pb-4 font-arabic">
      {/* Elevated center button - positioned absolutely to protrude above the bar */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10">
        <button
          onClick={() => navigate('/forum')}
          className="relative flex flex-col items-center"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
            "bg-primary hover:bg-primary/90 hover:scale-105",
            "shadow-[0_4px_20px_-4px_hsl(145_70%_45%/0.5)]"
          )}>
            <Users className="h-7 w-7 text-black" strokeWidth={2} />
          </div>
        </button>
      </div>
      
      <div className="relative glass-footer rounded-[28px]">
        <div className="flex justify-around items-center py-2">
          {navItems.map(({ icon: Icon, labelKey, path }, index) => {
            const isActive = location.pathname === path;
            const isCenter = index === 2; // Guftagu is the center item
            
            if (isCenter) {
              // Center placeholder - label only, button is elevated above
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex flex-col items-center py-3 px-4"
                >
                  {/* Invisible spacer for the elevated button */}
                  <div className="h-9 w-9" />
                  <span className={cn(
                    "text-xs font-bold transition-all duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>{t(labelKey)}</span>
                </button>
              );
            }
            
            // Regular nav items
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center py-3 px-4 text-xs font-medium transition-all duration-300 ease-out rounded-xl group relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300 relative",
                  isActive && "bg-gradient-to-br from-primary/20 to-primary/5"
                )}>
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-primary/15 blur-lg" />
                  )}
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-300 relative z-10",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(145_70%_45%/0.5)]" 
                      : "group-hover:scale-110"
                  )} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={cn(
                  "mt-1.5 transition-all duration-300",
                  isActive && "font-bold text-emerald-gradient"
                )}>{t(labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
