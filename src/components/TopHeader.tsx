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
        className="text-foreground hover:bg-primary/15 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/40 hover:shadow-[0_0_15px_-5px_hsl(45_85%_58%/0.3)] transition-all duration-300"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-foreground hover:bg-primary/15 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/40 hover:shadow-[0_0_15px_-5px_hsl(45_85%_58%/0.3)] transition-all duration-300"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
      </Button>
    </header>
  );
};
