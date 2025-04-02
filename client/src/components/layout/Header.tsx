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
    <header className="hidden md:flex bg-white shadow-sm h-16 z-10">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <h1 className="font-semibold text-xl">{title}</h1>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          
          <Button variant="ghost" size="sm" className="flex items-center text-gray-500">
            <Bell className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Notifications</span>
            {notifications > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications}
              </span>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="flex items-center text-gray-500">
            <HelpCircle className="h-5 w-5 mr-1" />
            <span className="hidden lg:inline">Help</span>
          </Button>
          
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="flex items-center">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&auto=format&fit=crop"
              alt="User Avatar"
              className="h-8 w-8 rounded-full mr-2"
            />
            <span className="text-sm font-medium">Capt. Smith</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
