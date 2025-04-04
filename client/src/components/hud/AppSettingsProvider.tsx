import { ReactNode, useEffect, useState } from 'react';
import { AppSettings, AppSettingsContextType } from '@/config/app-settings';

type AppSettingsProviderProps = {
  children: ReactNode;
};

export default function AppSettingsProvider({ children }: AppSettingsProviderProps) {
  const [appHeaderNone, setAppHeaderNone] = useState(false);
  const [appSidebarNone, setAppSidebarNone] = useState(false);
  const [appSidebarCollapsed, setAppSidebarCollapsed] = useState(false);
  const [appContentNone, setAppContentNone] = useState(false);
  const [appContentClass, setAppContentClass] = useState('');
  const [appContentFullHeight, setAppContentFullHeight] = useState(false);
  const [appBoxedLayout, setAppBoxedLayout] = useState(false);
  const [appFooter, setAppFooter] = useState(false);
  const [appTopNav, setAppTopNav] = useState(false);

  useEffect(() => {
    if (appHeaderNone) {
      document.body.classList.add('app-header-none');
    } else {
      document.body.classList.remove('app-header-none');
    }
    
    if (appSidebarNone) {
      document.body.classList.add('app-sidebar-none');
    } else {
      document.body.classList.remove('app-sidebar-none');
    }
    
    if (appSidebarCollapsed) {
      document.body.classList.add('app-sidebar-collapsed');
    } else {
      document.body.classList.remove('app-sidebar-collapsed');
    }
    
    if (appContentNone) {
      document.body.classList.add('app-content-none');
    } else {
      document.body.classList.remove('app-content-none');
    }
    
    if (appContentFullHeight) {
      document.body.classList.add('app-content-full-height');
    } else {
      document.body.classList.remove('app-content-full-height');
    }
    
    if (appBoxedLayout) {
      document.body.classList.add('boxed-layout');
    } else {
      document.body.classList.remove('boxed-layout');
    }
    
    if (appFooter) {
      document.body.classList.add('app-footer-fixed');
    } else {
      document.body.classList.remove('app-footer-fixed');
    }
    
    if (appTopNav) {
      document.body.classList.add('app-top-nav');
    } else {
      document.body.classList.remove('app-top-nav');
    }
  }, [
    appHeaderNone,
    appSidebarNone,
    appSidebarCollapsed,
    appContentNone,
    appContentFullHeight,
    appBoxedLayout,
    appFooter,
    appTopNav
  ]);

  useEffect(() => {
    if (appContentClass) {
      const classes = appContentClass.split(' ');
      for (let i = 0; i < classes.length; i++) {
        document.body.classList.add(classes[i]);
      }
    }
    
    return () => {
      if (appContentClass) {
        const classes = appContentClass.split(' ');
        for (let i = 0; i < classes.length; i++) {
          document.body.classList.remove(classes[i]);
        }
      }
    };
  }, [appContentClass]);

  const appSettingsContextValue: AppSettingsContextType = {
    setAppHeaderNone,
    setAppSidebarNone,
    setAppSidebarCollapsed,
    setAppContentNone,
    setAppContentClass,
    setAppContentFullHeight,
    setAppBoxedLayout,
    setAppFooter,
    setAppTopNav
  };

  return (
    <AppSettings.Provider value={appSettingsContextValue}>
      {children}
    </AppSettings.Provider>
  );
}