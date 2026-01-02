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
      {/* Watercolor atmospheric background - Sage Green #6a8b74 */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Deep black base */}
        <div className="absolute inset-0 bg-[#080808]" />
        
        {/* Large watercolor wash - top right - #6a8b74 shade */}
        <div 
          className="absolute -top-10 -right-10 w-[450px] h-[450px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(106, 139, 116, 0.35) 0%, rgba(106, 139, 116, 0.15) 50%, transparent 70%)' }}
        />
        
        {/* Watercolor wash - top left */}
        <div 
          className="absolute top-20 -left-20 w-[350px] h-[350px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(106, 139, 116, 0.28) 0%, rgba(90, 120, 100, 0.12) 50%, transparent 70%)' }}
        />
        
        {/* Large central wash */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[350px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(ellipse, rgba(106, 139, 116, 0.22) 0%, rgba(106, 139, 116, 0.08) 60%, transparent 80%)' }}
        />
        
        {/* Bottom watercolor wash */}
        <div 
          className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(106, 139, 116, 0.3) 0%, rgba(90, 120, 100, 0.1) 50%, transparent 70%)' }}
        />
        
        {/* Extra accent wash - right side */}
        <div 
          className="absolute top-1/2 -right-16 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(106, 139, 116, 0.25) 0%, transparent 60%)' }}
        />
        
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
        
        {/* Bottom fade for content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />
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
