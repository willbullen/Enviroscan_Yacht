import { useState } from "react";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  isMobile?: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, isMobile, onMenuClick }) => {
  const [notifications, setNotifications] = useState(3);

  return (
    <TooltipProvider>
      <header className={cn(
        "bg-background border-b border-border shadow-sm h-16 z-20 w-full",
        "sticky top-0 left-0 right-0"
      )}>
        <div className="px-4 md:px-6 flex justify-between items-center h-full">
          <div className="flex items-center">
            {/* Show hamburger menu on desktop but hidden on mobile (mobile has its own) */}
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="mr-2 md:mr-4"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Toggle sidebar menu</p>
                </TooltipContent>
              </Tooltip>
            )}
            <h1 className="font-semibold text-lg md:text-xl">{title}</h1>
          </div>

          {/* Search input with specific placeholder text */}
          <div className="hidden md:flex items-center relative max-w-xs mx-4 flex-1">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder={title === "Financial Management" ? "Search Finances..." : `Search ${title}...`}
                className="pl-9 h-9 pr-4 w-full focus-visible:ring-primary/30"
                aria-label={`Search ${title} content`}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <ThemeSwitcher />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center text-muted-foreground">
                  <Bell className="h-5 w-5 mr-1" />
                  <span className="hidden lg:inline">Notifications</span>
                  {notifications > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>View system notifications</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex items-center text-muted-foreground">
                  <HelpCircle className="h-5 w-5 mr-1" />
                  <span className="hidden lg:inline">Help</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>View help documentation</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="hidden md:block h-8 w-px bg-border"></div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden md:flex items-center cursor-pointer">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-2">
                    <span className="text-xs font-bold">CS</span>
                  </div>
                  <span className="text-sm font-medium">Capt. Smith</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>View user profile and settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
