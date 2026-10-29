import Script from 'next/script';

import { useAdsContext } from '../context/ads-context';
import { flushReviveRefresh, isReviveAvailable } from './revive-ad';

const REVIVE_SCRIPT_URL = 'https://servedby.revive-adserver.net/asyncjs.php';

export const ReviveScript = () => {
  const { setReviveStatus } = useAdsContext();

  return (
    <Script
      src={REVIVE_SCRIPT_URL}
      strategy="afterInteractive"
      onReady={() => {
        if (!isReviveAvailable()) {
          setReviveStatus('blocked');
          return;
        }
        setReviveStatus('ready');
        flushReviveRefresh();
      }}
      onError={() => setReviveStatus('blocked')}
    />
  );
};
