import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the settings structure
interface SystemSettings {
  useMockBankingData: boolean;
  aiReceiptMatching: boolean;
  // Add other system-wide settings here as needed
}

// Default settings
const defaultSettings: SystemSettings = {
  useMockBankingData: true, // Default to using mock data
  aiReceiptMatching: true, // Default to using AI for receipt matching
};

// Context type definition
interface SystemSettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

// Create the context with default values
const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

// Hook for using the context
export const useSystemSettings = () => useContext(SystemSettingsContext);

// Provider component
interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  // Initialize state with defaults, overridden by localStorage if available
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
  }, [settings]);

  // Function to update settings
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export default SystemSettingsProvider;