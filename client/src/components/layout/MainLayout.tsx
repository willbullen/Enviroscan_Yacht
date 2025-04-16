import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Mobile Header - Fixed */}
      {isMobile && (
        <div className="bg-navy-dark text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center">
            <div className="h-10 w-auto flex items-center justify-center text-white mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 40 40" fill="none">
                <path d="M0 40l2.783-7.544C4.293 28.353 8.89 25.028 13.045 25.028h30.567l7.643 7.546H10.249c-4.157 0-8.75 3.325-10.264 7.426z" fill="white"/>
                <path d="M3.789 28.784l2.783-7.545c1.513-4.1 6.11-7.426 10.266-7.426h15.398l7.644 7.544H14.04c-4.156 0-8.753 3.326-10.266 7.427z" fill="white"/>
                <path d="M7.753 17.555l2.779-7.546c1.515-4.1 6.108-7.425 10.264-7.425h.064l7.644 7.544h-10.49c-4.157 0-8.749 3.326-10.261 7.427z" fill="white"/>
              </svg>
            </div>
            <span className="font-semibold text-lg">Eastwind Management</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-navy"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-1 h-screen">
        {/* Sidebar - Fixed position */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Content area - No margin/padding between sidebar and content */}
        <div 
          className={cn(
            "flex-1 flex flex-col relative",
            isMobile ? "ml-0" : "ml-0", // Remove margin completely
            "transition-all duration-300"
          )}
        >
          {/* Desktop Header */}
          <div className={isMobile ? "hidden" : "block"}>
            <Header title={title} />
          </div>

          {/* Main content - Scrollable with reduced padding */}
          <main 
            className={cn(
              "flex-1 overflow-y-auto bg-background",
              isMobile ? "pt-16" : "", // Add padding for mobile header
              "p-3 md:p-4" // Reduced padding
            )}
          >
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
