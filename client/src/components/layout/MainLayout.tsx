import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, PanelRightOpen, PanelRightClose, Ship } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import VesselSelector from "../vessel/VesselSelector";
import { useVessel } from "@/contexts/VesselContext";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { currentVessel, setCurrentVessel } = useVessel();

  useEffect(() => {
    // Close sidebar on mobile, open on desktop
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Sidebar - Fixed position */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content area with fixed header and scrollable content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Dark bezel around the top */}
        <div className="h-2 bg-black rounded-t-lg z-20"></div>
        
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
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
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
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-medium text-primary text-sm">CS</span>
              </div>
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
