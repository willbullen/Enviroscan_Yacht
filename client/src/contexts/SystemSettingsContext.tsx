import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SystemSettings {
  useLiveBankingData: boolean;
  bankingAPICredentialsSet: boolean;
  toggleLiveBankingData: () => void;
  // Add more system settings as needed
}

const SystemSettingsContext = createContext<SystemSettings | undefined>(undefined);

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [useLiveBankingData, setUseLiveBankingData] = useState(false);
  
  // In a real app, this would be determined by checking if the API credentials are set in the database
  // For demo purposes, we'll assume they're not set
  const [bankingAPICredentialsSet, setBankingAPICredentialsSet] = useState(false);
  
  const toggleLiveBankingData = () => {
    setUseLiveBankingData(prev => !prev);
  };

  const value = {
    useLiveBankingData,
    bankingAPICredentialsSet,
    toggleLiveBankingData,
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