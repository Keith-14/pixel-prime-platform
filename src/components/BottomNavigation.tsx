import { Home, Newspaper, Users, MapPin, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, labelKey: 'nav.home', path: '/' },
    { icon: Newspaper, labelKey: 'nav.news', path: '/news' },
    { icon: Users, labelKey: 'nav.guftagu', path: '/forum' },
    { icon: MapPin, labelKey: 'nav.places', path: '/places' },
    { icon: User, labelKey: 'nav.account', path: '/account' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-30 px-4 pb-4 font-arabic">
      <div className="glass-dark rounded-2xl shadow-lg">
        <div className="flex justify-around py-2">
          {navItems.map(({ icon: Icon, labelKey, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center py-3 px-4 text-xs font-medium transition-all duration-300 ease-out rounded-xl group",
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
                    isActive ? "text-primary drop-shadow-[0_0_8px_hsl(145_70%_45%/0.5)]" : "group-hover:scale-110"
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
