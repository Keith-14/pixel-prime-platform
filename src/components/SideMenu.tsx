import { 
  BookOpen, 
  ShoppingBag, 
  MapPin, 
  User, 
  HelpCircle, 
  TrendingUp,
  Plane,
  Building2,
  X,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: BookOpen, label: 'Quran', path: '/quran' },
  { icon: ShoppingBag, label: 'Shop', path: '/shop' },
  { icon: MapPin, label: 'Nearby Places', path: '/places' },
  { icon: Plane, label: 'Hajj', path: '/hajj' },
  { icon: Building2, label: 'Business Account', path: '/business-account' },
  { icon: User, label: 'Account', path: '/account' },
  { icon: HelpCircle, label: "FAQ's", path: '/faq' },
  { icon: TrendingUp, label: 'Your Progress', path: '/progress' },
];

export const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay with blur */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/85 backdrop-blur-md z-40 transition-all duration-400 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Menu with premium styling */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] glass-gold z-50 transform transition-transform duration-400 ease-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Premium header with gradient */}
        <div className="relative overflow-hidden px-6 py-6 flex items-center justify-between border-b border-primary/30">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-[radial-gradient(circle_at_top_left,hsl(45_85%_58%/0.2),transparent_60%)]" />
          
          <h2 className="relative text-xl font-bold text-gold-gradient tracking-tight flex items-center gap-2">
            Menu
            <Sparkles className="h-4 w-4 text-primary/60" />
          </h2>
          <button 
            onClick={onClose}
            className="relative p-2.5 hover:bg-primary/15 rounded-xl transition-all duration-300 text-primary border border-primary/30 hover:border-primary/50 hover:shadow-[0_0_15px_-5px_hsl(45_85%_58%/0.4)]"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Menu Items with hover effects */}
        <div className="py-3 px-3">
          {menuItems.map(({ icon: Icon, label, path }, index) => (
            <button
              key={path}
              onClick={() => handleNavigate(path)}
              className="group w-full flex items-center gap-4 px-4 py-4 my-1 rounded-xl text-foreground hover:bg-gradient-to-r hover:from-primary/15 hover:to-transparent transition-all duration-300 ease-out"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_-5px_hsl(45_85%_58%/0.4)] transition-all duration-300">
                <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
              </div>
              <span className="font-medium text-base group-hover:text-primary transition-colors duration-300">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
