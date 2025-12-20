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
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      {/* Islamic pattern background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-sage-light/30 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%236B8E7A' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20zM0 20v20h20c0-11.046-8.954-20-20-20z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      {showHeader && <TopHeader onMenuClick={handleMenuClick} />}
      
      <main className={cn(
        "flex-1 relative z-10",
        showNavigation && "pb-20",
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