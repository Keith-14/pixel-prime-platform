import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader = ({ onMenuClick }: TopHeaderProps) => {
  return (
    <header className="relative z-20 px-5 py-4 flex items-center justify-between">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/30"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/30"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
      </Button>
    </header>
  );
};
