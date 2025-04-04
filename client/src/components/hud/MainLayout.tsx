import { ReactNode, useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { ThemePanel } from '@/components/hud/ThemePanel';
import AppSettingsProvider from './AppSettingsProvider';

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('theme-teal');
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    // Check local storage for theme settings
    const savedTheme = localStorage.getItem('app-theme') || 'theme-teal';
    const savedMode = localStorage.getItem('app-theme-mode') || 'dark';
    
    // Remove any existing theme classes first
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-') && className !== 'theme-panel') {
        document.body.classList.remove(className);
      }
    });
    
    // Apply theme
    setCurrentTheme(savedTheme);
    document.body.classList.add(savedTheme);
    
    // Apply dark mode
    setThemeMode(savedMode);
    if (savedMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Check for mobile view
    const checkWindowWidth = () => {
      if (window.innerWidth <= 992) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    
    checkWindowWidth();
    window.addEventListener('resize', checkWindowWidth);
    
    return () => {
      window.removeEventListener('resize', checkWindowWidth);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleThemeChange = (theme: string) => {
    // Remove existing theme class
    document.body.classList.forEach(className => {
      if (className.startsWith('theme-') && className !== 'theme-panel') {
        document.body.classList.remove(className);
      }
    });
    
    // Apply new theme
    document.body.classList.add(theme);
    setCurrentTheme(theme);
    localStorage.setItem('app-theme', theme);
  };

  const handleThemeModeChange = (mode: string) => {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    setThemeMode(mode);
    localStorage.setItem('app-theme-mode', mode);
  };

  return (
    <AppSettingsProvider>
      <div className={`app ${sidebarCollapsed ? 'app-sidebar-collapsed' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Sidebar toggleSidebar={toggleSidebar} />
        
        <div className="app-content">
          <div className="container-fluid py-3">
            {children}
          </div>
        </div>
        
        <ThemePanel 
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
          themeMode={themeMode}
          onThemeModeChange={handleThemeModeChange}
        />
      </div>
    </AppSettingsProvider>
  );
};

export default MainLayout;