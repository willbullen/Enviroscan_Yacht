import React, { createContext, useContext, useState, useEffect } from 'react';

interface SystemSettings {
  useLiveBankingData: boolean;
  setUseLiveBankingData: (value: boolean) => void;
  bankingAPICredentialsSet: {
    centtrip: boolean;
    revolut: boolean;
  };
  setBankingAPICredentialsSet: (providers: {
    centtrip?: boolean;
    revolut?: boolean;
  }) => void;
}

const defaultSettings: SystemSettings = {
  useLiveBankingData: false,
  setUseLiveBankingData: () => {},
  bankingAPICredentialsSet: {
    centtrip: false,
    revolut: false,
  },
  setBankingAPICredentialsSet: () => {},
};

const SystemSettingsContext = createContext<SystemSettings>(defaultSettings);

export const useSystemSettings = () => useContext(SystemSettingsContext);

interface SystemSettingsProviderProps {
  children: React.ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [useLiveBankingData, setUseLiveBankingData] = useState<boolean>(false);
  const [bankingAPICredentialsSet, setBankingAPICredentialsSetInternal] = useState<{
    centtrip: boolean;
    revolut: boolean;
  }>({
    centtrip: false,
    revolut: false,
  });

  // Load settings from local storage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('systemSettings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (typeof parsed.useLiveBankingData === 'boolean') {
          setUseLiveBankingData(parsed.useLiveBankingData);
        }
        if (parsed.bankingAPICredentialsSet) {
          setBankingAPICredentialsSetInternal(parsed.bankingAPICredentialsSet);
        }
      }
    } catch (error) {
      console.error('Error loading system settings from localStorage:', error);
    }
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    try {
      localStorage.setItem(
        'systemSettings',
        JSON.stringify({
          useLiveBankingData,
          bankingAPICredentialsSet,
        })
      );
    } catch (error) {
      console.error('Error saving system settings to localStorage:', error);
    }
  }, [useLiveBankingData, bankingAPICredentialsSet]);

  const setBankingAPICredentialsSet = (providers: {
    centtrip?: boolean;
    revolut?: boolean;
  }) => {
    setBankingAPICredentialsSetInternal((prev) => ({
      ...prev,
      ...providers,
    }));
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        useLiveBankingData,
        setUseLiveBankingData,
        bankingAPICredentialsSet,
        setBankingAPICredentialsSet,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export default SystemSettingsProvider;