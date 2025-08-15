import { ReactNode, useState } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { TopHeader } from './TopHeader';
import { SideMenu } from './SideMenu';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
}

export const Layout = ({ children, showNavigation = true, showHeader = true }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      
      <main className={`flex-1 relative z-10 ${showNavigation ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {showNavigation && <BottomNavigation />}
      
      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </div>
  );
};