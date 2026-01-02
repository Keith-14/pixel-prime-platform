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
      {/* Background with sage green gradient #6a8b74 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep black base */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        
        {/* Sage green gradient at top - fading into black */}
        <div 
          className="absolute top-0 left-0 right-0 h-[70%]"
          style={{ 
            background: 'linear-gradient(180deg, rgba(106, 139, 116, 0.3) 0%, rgba(106, 139, 116, 0.15) 25%, rgba(106, 139, 116, 0.05) 50%, transparent 100%)' 
          }}
        />
        
        {/* Subtle radial glow at top-right corner for depth */}
        <div 
          className="absolute -top-10 -right-10 w-[350px] h-[350px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(106, 139, 116, 0.25) 0%, transparent 70%)' 
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
