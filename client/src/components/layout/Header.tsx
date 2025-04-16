import { useState } from "react";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, isMobile, onMenuClick }) => {
  const [notifications, setNotifications] = useState(3);

  return (
    <header className={cn(
      "bg-background border-b border-border shadow-sm h-16 z-20 w-full",
      "sticky top-0 left-0 right-0"
    )}>
      <div className="px-4 md:px-6 flex justify-between items-center h-full">
        <div className="flex items-center">
          {/* Show hamburger menu on desktop but hidden on mobile (mobile has its own) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="mr-2 md:mr-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-semibold text-lg md:text-xl">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <ThemeSwitcher />
          
          <Button variant="ghost" size="sm" className="flex items-center text-muted-foreground">
            <Bell className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Notifications</span>
            {notifications > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="hidden md:flex items-center text-muted-foreground">
            <HelpCircle className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Help</span>
          </Button>
          
          <div className="hidden md:block h-8 w-px bg-border"></div>
          
          <div className="hidden md:flex items-center">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
              <span className="text-xs font-bold">CS</span>
            </div>
            <span className="text-sm font-medium">Capt. Smith</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
