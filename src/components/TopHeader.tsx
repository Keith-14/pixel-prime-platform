import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  return (
    <header className="relative z-20 bg-sage text-primary-foreground px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary-foreground hover:bg-white/20"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-medium">Assalamu Alaikum!</span>
      </div>
      
      <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
};