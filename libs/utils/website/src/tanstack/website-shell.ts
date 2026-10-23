import { useRouterState } from '@tanstack/react-router';
import { useMemo } from 'react';

import {
  getWebsiteShell,
  WebsiteShell,
  WebsiteShellProps,
} from '../lib/website-shell';

export const useWebsiteShell = (): WebsiteShell => {
  const matches = useRouterState({ select: state => state.matches });

  return useMemo(() => {
    const deepest = [...matches]
      .reverse()
      .find(match => (match.loaderData as WebsiteShellProps | undefined)?.shell);

    return getWebsiteShell(deepest?.loaderData as WebsiteShellProps | undefined);
  }, [matches]);
};
