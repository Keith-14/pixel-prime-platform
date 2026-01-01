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
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Multi-layer atmospheric background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(140_25%_7%)] via-[hsl(140_20%_5%)] to-[hsl(140_15%_3%)]" />
        
        {/* Starry layer */}
        <div className="absolute inset-0 bg-stars opacity-70" />
        
        {/* Top gold glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_top,hsl(45_85%_58%/0.12),transparent_60%)]" />
        
        {/* Center horizon glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full h-[300px] bg-[radial-gradient(ellipse_at_center,hsl(45_85%_50%/0.08),transparent_70%)]" />
        
        {/* Subtle emerald accent */}
        <div className="absolute bottom-0 left-0 w-1/2 h-[400px] bg-[radial-gradient(ellipse_at_bottom_left,hsl(145_55%_30%/0.08),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-1/2 h-[400px] bg-[radial-gradient(ellipse_at_bottom_right,hsl(145_55%_30%/0.08),transparent_60%)]" />
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
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
