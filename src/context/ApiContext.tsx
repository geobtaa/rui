import React, { createContext, useContext, useState } from 'react';

interface ApiContextType {
  lastApiUrl: string | null;
  setLastApiUrl: (url: string) => void;
}

const ApiContext = createContext<ApiContextType | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [lastApiUrl, setLastApiUrl] = useState<string | null>(null);

  return (
    <ApiContext.Provider value={{ lastApiUrl, setLastApiUrl }}>
      {children}
    </ApiContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
