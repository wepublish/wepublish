import { EenewsPageShell } from '@wepublish/tenant/eenews';
import { ComponentType } from 'react';

/** Wraps a route component in ee-news's max-width, padded page shell. */
export const withEenewsPageShell = (Component: ComponentType) =>
  function WithEenewsPageShell() {
    return (
      <EenewsPageShell>
        <Component />
      </EenewsPageShell>
    );
  };
