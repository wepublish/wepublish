import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

export type ReviveStatus = 'pending' | 'ready' | 'blocked';

interface AdsContextType {
  adsDisabled: boolean;
  setAdsDisabled: (disabled: boolean) => void;
  reviveStatus: ReviveStatus;
  setReviveStatus: (status: ReviveStatus) => void;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export const AdsProvider = ({ children }: { children: ReactNode }) => {
  const [adsDisabled, setAdsDisabled] = useState(false);
  const [reviveStatus, setReviveStatus] = useState<ReviveStatus>('pending');

  const value = useMemo(
    () => ({ adsDisabled, setAdsDisabled, reviveStatus, setReviveStatus }),
    [adsDisabled, reviveStatus]
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
};

export const useAdsContext = () => {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAdsContext must be used within an AdsProvider');
  }
  return context;
};
