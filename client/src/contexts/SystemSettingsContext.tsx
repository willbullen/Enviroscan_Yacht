import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemSettings {
  useMockBankingData: boolean;
  aiReceiptMatching: boolean;
  // Add other system-wide settings here as needed
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  isLoading: boolean;
}

const defaultSettings: SystemSettings = {
  useMockBankingData: true, // Default to mock data until API keys are configured
  aiReceiptMatching: true,
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider = ({ children }: SystemSettingsProviderProps) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on initial mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const storedSettings = localStorage.getItem('systemSettings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          setSettings(prevSettings => ({
            ...prevSettings,
            ...parsedSettings
          }));
        }
      } catch (error) {
        console.warn('Failed to load system settings from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update settings function
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      // Save to localStorage
      try {
        localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('Failed to save system settings to localStorage:', error);
      }
      
      return updatedSettings;
    });
  };

  const value = {
    settings,
    updateSettings,
    isLoading
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};