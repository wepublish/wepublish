import { ComponentType, createElement, memo } from 'react';
import { storePaywallBypassToken } from './paywall-bypass';

export const withPaywallBypassToken = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const paywallToken = url.searchParams.get('key');

      if (paywallToken) {
        url.searchParams.delete('key');
        window.history.replaceState(null, '', url.toString());
        storePaywallBypassToken(paywallToken);
      }
    }

    return createElement(ControlledComponent, props as P);
  });
