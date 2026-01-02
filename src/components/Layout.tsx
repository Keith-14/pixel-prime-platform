import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { TopHeader } from './TopHeader';
import { SideMenu } from './SideMenu';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
}

export const Layout = ({ children, showNavigation = true, showHeader = true }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const location = useLocation();

  // Trigger page transition animation on route change
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden font-arabic">
      {/* Background with sage green tint #6a8b74 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Dark green-tinted base */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(180deg, rgba(40, 55, 45, 1) 0%, rgba(25, 35, 28, 1) 50%, rgba(15, 20, 16, 1) 100%)' 
          }}
        />
        
        {/* Sage green overlay for the tint */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'rgba(106, 139, 116, 0.08)' 
          }}
        />
        
        {/* Subtle lighter glow at top center */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%]"
          style={{ 
            background: 'radial-gradient(ellipse at top, rgba(106, 139, 116, 0.15) 0%, transparent 70%)' 
          }}
        />
      </div>
      
      {showHeader && <TopHeader onMenuClick={handleMenuClick} />}
      
      <main className={cn(
        "flex-1 relative z-10",
        showNavigation && "pb-24",
        isTransitioning && "animate-fade-in"
      )}>
        {children}
      </main>
      
      {showNavigation && <BottomNavigation />}
      
      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </div>
  );
};
