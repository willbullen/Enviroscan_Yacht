import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, PanelRightOpen, PanelRightClose, Ship, LogOut, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import VesselSelector from "../vessel/VesselSelector";
import { useVessel } from "@/contexts/VesselContext";
import { useAuth } from "@/hooks/use-auth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { currentVessel, setCurrentVessel } = useVessel();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    // Close sidebar on mobile, open on desktop
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Sidebar - Fixed position */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area with fixed header and scrollable content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[hsl(var(--sidebar-background))]">
        {/* Dark bezel around the top */}
        <div className="h-2 bg-[hsl(var(--sidebar-background))] rounded-t-lg z-20"></div>
        
        {/* Top header navigation - Fixed */}
        <header className="h-14 border-b flex items-center px-4 bg-background/95 backdrop-blur z-10 sticky top-0 rounded-t-lg">
          <div className="flex items-center gap-4 w-full">
            {/* Left section */}
            <div className="flex items-center gap-2">
              {/* Mobile menu button */}
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              
              {/* Desktop toggle sidebar button */}
              {!isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hover:bg-primary/10 transition-all duration-200"
                  title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                  {sidebarOpen ? 
                    <PanelRightClose className="h-5 w-5 text-muted-foreground hover:text-primary transition-all" /> : 
                    <PanelRightOpen className="h-5 w-5 text-muted-foreground hover:text-primary transition-all" />
                  }
                </Button>
              )}
              
              {/* Page title */}
              <div className="font-medium hidden md:block">{title}</div>
              
              {/* Search bar */}
              <div className="hidden md:flex mx-4 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 bg-background border-none shadow-none focus-visible:ring-0 w-[180px]" 
                />
              </div>
            </div>
            
            {/* Center section - Current Vessel Name */}
            <div className="hidden md:flex flex-1 justify-center items-center">
              <div className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">{currentVessel.name}</span>
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-3">
              <VesselSelector 
                currentVesselId={currentVessel.id} 
                onVesselChange={setCurrentVessel} 
              />
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-medium text-primary text-sm">
                          {user.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.fullName}</span>
                        <span className="text-xs text-muted-foreground">{user.username}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Main content area - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background rounded-b-lg">
          {children}
        </main>
      </div>
      
      {/* Backdrop for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
