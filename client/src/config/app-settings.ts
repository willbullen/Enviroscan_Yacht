import { createContext, useContext } from 'react';

export interface AppSettingsContextType {
  setAppHeaderNone: (value: boolean) => void;
  setAppSidebarNone: (value: boolean) => void;
  setAppSidebarCollapsed: (value: boolean) => void;
  setAppContentNone: (value: boolean) => void;
  setAppContentClass: (value: string) => void;
  setAppContentFullHeight: (value: boolean) => void;
  setAppBoxedLayout: (value: boolean) => void;
  setAppFooter: (value: boolean) => void;
  setAppTopNav: (value: boolean) => void;
}

export const AppSettings = createContext<AppSettingsContextType | undefined>(undefined);

export function useAppSettings() {
  const context = useContext(AppSettings);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettings.Provider');
  }
  return context;
}