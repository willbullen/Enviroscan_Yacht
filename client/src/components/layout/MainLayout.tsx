import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    // Close sidebar on mobile, open on desktop
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Top header navigation */}
          <header className="h-14 border-b flex items-center px-4 sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-4 w-full">
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
              <div className="hidden md:flex mx-4 flex-1 max-w-sm relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 bg-background border-none shadow-none focus-visible:ring-0" 
                />
              </div>
              
              {/* Right side actions */}
              <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-medium text-primary text-sm">CS</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main content area with scrolling */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
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
