import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useMobile } from "@/hooks/use-mobile";

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
    <div className="h-screen flex flex-col">
      {/* Mobile Header - Fixed */}
      {isMobile && (
        <div className="bg-navy-dark text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l18-5v12L3 11z"></path>
                <path d="M9.5 6.5l1 9.5"></path>
                <path d="M16.5 15.5l-.3-12"></path>
              </svg>
            </div>
            <span className="font-semibold text-lg">IDEA YACHT</span>
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

      <div className="flex flex-1 h-screen bg-background">
        {/* Sidebar is already fixed by design */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header is already sticky in Header.tsx */}
          <Header title={title} />

          {/* Main Content - Scrollable */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
            {/* Add padding-top for mobile to account for fixed header */}
            <div className={isMobile ? "pt-16" : ""}>
              {children}
            </div>
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
