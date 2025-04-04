import { useState } from "react";
import { Bell, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [notifications, setNotifications] = useState(3);

  return (
    <header className="hidden md:flex bg-background dark:border-b border-border shadow-sm h-16 z-10 sticky top-0">
      <div className="container mx-auto px-6 flex justify-between items-center h-full">
        <h1 className="font-semibold text-xl">{title}</h1>
        <div className="flex items-center space-x-4">
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
          
          <Button variant="ghost" size="sm" className="flex items-center text-muted-foreground">
            <HelpCircle className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Help</span>
          </Button>
          
          <div className="h-8 w-px bg-border"></div>
          
          <div className="flex items-center">
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
