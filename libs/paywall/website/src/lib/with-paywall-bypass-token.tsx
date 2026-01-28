import { ComponentType, memo } from 'react';
import { storeBypassToken } from './paywall-bypass';
import { collapseBanner } from '@wepublish/banner/website';

export const withPaywallBypassToken = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object,
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const paywallToken = url.searchParams.get('key');

      if (paywallToken) {
        url.searchParams.delete('key');
        window.history.replaceState(null, '', url.toString());
        storeBypassToken(paywallToken);
        collapseBanner();
      }
    }

    return <ControlledComponent {...(props as P)} />;
  });
