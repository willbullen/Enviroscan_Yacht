import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define settings types
export interface SystemSettings {
  useMockBankingData: boolean;
  aiReceiptMatching: boolean;
  bankingAPICredentialsSet: {
    centtrip: boolean;
    revolut: boolean;
  };
  updateSettings: (settings: Partial<SystemSettingsState>) => void;
}

interface SystemSettingsState {
  useMockBankingData: boolean;
  aiReceiptMatching: boolean;
  bankingAPICredentialsSet: {
    centtrip: boolean;
    revolut: boolean;
  };
}

const STORAGE_KEY = 'eastwind_system_settings';

const defaultSettings: SystemSettingsState = {
  useMockBankingData: true, // Default to use mock data until real API keys are configured
  aiReceiptMatching: true,  // Enable AI receipt matching by default
  bankingAPICredentialsSet: {
    centtrip: false,
    revolut: false
  }
};

const SystemSettingsContext = createContext<SystemSettings | undefined>(undefined);

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettingsState>(defaultSettings);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem(STORAGE_KEY);
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsedSettings
          }));
        }
      } catch (error) {
        console.error('Failed to load system settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);
  
  // Update settings
  const updateSettings = (newSettings: Partial<SystemSettingsState>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const value: SystemSettings = {
    ...settings,
    updateSettings
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = (): SystemSettings => {
  const context = useContext(SystemSettingsContext);
  
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  
  return context;
};

export default SystemSettingsContext;