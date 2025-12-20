import { Home, BookOpen, Users, MapPin, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'HOME', path: '/' },
  { icon: BookOpen, label: 'QURAN', path: '/quran' },
  { icon: Users, label: 'FORUM', path: '/forum' },
  { icon: MapPin, label: 'PLACES', path: '/places' },
  { icon: User, label: 'ACCOUNT', path: '/account' },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-cream border-t border-sage-light z-30">
      <div className="flex justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center py-2 px-3 text-xs font-medium transition-all duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-95",
                isActive 
                  ? "text-sage scale-105" 
                  : "text-muted-foreground hover:text-sage hover:scale-105"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1 transition-transform duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "transition-all duration-[200ms]",
                isActive && "font-semibold"
              )}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};