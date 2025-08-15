import { 
  BookOpen, 
  ShoppingBag, 
  MapPin, 
  User, 
  HelpCircle, 
  TrendingUp,
  X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: BookOpen, label: 'QURAN', path: '/quran' },
  { icon: ShoppingBag, label: 'SHOP', path: '/shop' },
  { icon: MapPin, label: 'NEARBY PLACES', path: '/places' },
  { icon: User, label: 'ACCOUNT', path: '/account' },
  { icon: HelpCircle, label: "FAQ'S", path: '/faq' },
  { icon: TrendingUp, label: 'YOUR PROGRESS', path: '/progress' },
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
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Menu */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-sage z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="bg-sage text-primary-foreground px-4 py-4 flex items-center justify-between border-b border-sage-dark">
          <h2 className="text-xl font-bold">MENU</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-4">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => handleNavigate(path)}
              className="w-full flex items-center space-x-4 px-6 py-4 text-primary-foreground hover:bg-sage-dark transition-colors"
            >
              <Icon className="h-6 w-6" />
              <span className="font-medium text-lg">{label}</span>
            </button>
          ))}
        </div>

        {/* Islamic pattern overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569-13.431-30-30-30v30h30zM0 30v30h30c0-16.569-13.431-30-30-30z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      </div>
    </>
  );
};