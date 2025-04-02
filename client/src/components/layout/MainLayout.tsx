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
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-navy-dark text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="https://images.unsplash.com/photo-1659212209972-21e614984595?w=60&h=60&auto=format&crop=faces&fit=crop"
              alt="Yacht Logo"
              className="h-10 w-10 rounded-full mr-3"
            />
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

      <div className="flex flex-1 overflow-hidden bg-slate-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
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
