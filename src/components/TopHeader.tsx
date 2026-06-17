import { Menu, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ReactNode } from 'react';

interface TopHeaderProps {
  onMenuClick: () => void;
  title?: string;
  rightContent?: ReactNode;
  onSearchClick?: () => void;
  showSearch?: boolean;
}

export const TopHeader = ({ onMenuClick, title, rightContent, onSearchClick, showSearch }: TopHeaderProps) => {
  return (
    <header className="relative z-20 px-5 py-4 flex items-center justify-between font-arabic">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/25 transition-all duration-300"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </Button>
      
      {title && (
        <h1 className="text-xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Reem Kufi', serif" }}>
          {title}
        </h1>
      )}
      
      <div className="flex items-center gap-2">
        {rightContent ? rightContent : (
          <>
            <LanguageSelector />
            {showSearch ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/25 transition-all duration-300"
                onClick={onSearchClick}
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-primary/10 hover:text-primary rounded-xl h-10 w-10 border border-transparent hover:border-primary/25 transition-all duration-300"
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
};
