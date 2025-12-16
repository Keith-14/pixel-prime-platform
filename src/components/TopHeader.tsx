import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  return (
    <header className="relative z-20 px-4 py-4 flex items-center justify-between">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-foreground hover:bg-muted -ml-2"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted -mr-2">
        <Bell className="h-5 w-5" />
      </Button>
    </header>
  );
};
