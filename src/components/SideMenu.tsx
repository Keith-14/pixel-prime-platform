import { 
  BookOpen, 
  ShoppingBag, 
  MapPin, 
  User, 
  HelpCircle, 
  TrendingUp,
  Plane,
  Building2,
  X 
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
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-all duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Menu */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card border-r border-primary/30 z-50 transform transition-transform duration-300 ease-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/30 px-6 py-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary tracking-tight">Menu</h2>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-primary/10 rounded-xl transition-all duration-200 text-primary border border-primary/30"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-3">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => handleNavigate(path)}
              className="w-full flex items-center gap-4 px-6 py-4 text-foreground hover:bg-primary/10 transition-all duration-200 ease-out group"
            >
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors duration-200">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <span className="font-medium text-base">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
