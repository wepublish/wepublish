import { useEffect } from 'react';

import { useAdsContext } from '../context/ads-context';
import { flushReviveRefresh, isReviveAvailable } from './revive-ad';

const REVIVE_SCRIPT_URL = 'https://servedby.revive-adserver.net/asyncjs.php';

/**
 * Loads Revive after hydration (was `next/script` with
 * `strategy="afterInteractive"`). Injected from an effect rather than rendered
 * as `<script>`: a server-rendered tag can finish loading before React attaches
 * `onLoad`/`onError`, and the ads would then never leave the loading state.
 */
export const ReviveScript = () => {
  const { setReviveStatus } = useAdsContext();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = REVIVE_SCRIPT_URL;
    script.async = true;

    script.addEventListener('load', () => {
      if (!isReviveAvailable()) {
        setReviveStatus('blocked');
        return;
      }
      setReviveStatus('ready');
      flushReviveRefresh();
    });
    script.addEventListener('error', () => setReviveStatus('blocked'));

    document.body.appendChild(script);

    return () => script.remove();
  }, [setReviveStatus]);

  return null;
};
