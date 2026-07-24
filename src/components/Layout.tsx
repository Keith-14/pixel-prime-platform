import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import { TopHeader } from "./TopHeader";
import { SideMenu } from "./SideMenu";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
  pageBackgroundColor?: string;
  headerTitle?: string;
  headerRight?: ReactNode;
  onSearchClick?: () => void;
  showSearch?: boolean;
  headerClassName?: string;
  headerTitleClassName?: string;
  headerTitleStyle?: React.CSSProperties;
  headerButtonClassName?: string;
  leftAlignHeaderTitle?: boolean;
}

export const Layout = ({
  children,
  showNavigation = true,
  showHeader = true,
  pageBackgroundColor = "#FFF5E5",
  headerTitle,
  headerRight,
  onSearchClick,
  showSearch,
  headerClassName,
  headerTitleClassName,
  headerTitleStyle,
  headerButtonClassName,
  leftAlignHeaderTitle,
}: LayoutProps) => {
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
    <div
      className={cn(
        "min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden font-arabic",
      )}
      style={{
        backgroundColor: pageBackgroundColor,
        paddingTop: showHeader ? undefined : "env(safe-area-inset-top)",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: pageBackgroundColor }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(163,82,51,0.08),transparent_58%)]" />
      </div>

      {showHeader && (
        <TopHeader
          onMenuClick={handleMenuClick}
          title={headerTitle}
          rightContent={headerRight}
          onSearchClick={onSearchClick}
          showSearch={showSearch}
          className={headerClassName}
          titleClassName={headerTitleClassName}
          titleStyle={headerTitleStyle}
          buttonClassName={headerButtonClassName}
          leftAlignTitle={leftAlignHeaderTitle}
        />
      )}

      <main
        className={cn(
          "flex-1 relative z-10",
          showNavigation ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-[env(safe-area-inset-bottom)]",
          isTransitioning && "animate-fade-in",
        )}
        style={{ backgroundColor: pageBackgroundColor }}
      >
        {children}
      </main>

      {showNavigation && <BottomNavigation />}

      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={handleMenuClose} />
    </div>
  );
};
