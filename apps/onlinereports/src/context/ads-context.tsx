import { createContext, ReactNode, useContext, useState } from 'react';

interface AdsContextType {
  adsDisabled: boolean;
  setAdsDisabled: (disabled: boolean) => void;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export const AdsProvider = ({ children }: { children: ReactNode }) => {
  const [adsDisabled, setAdsDisabled] = useState(false);
  return (
    <AdsContext.Provider value={{ adsDisabled, setAdsDisabled }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAdsContext = () => {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAdsContext must be used within an AdsProvider');
  }
  return context;
};
