import { useRouterState } from '@tanstack/react-router';
import { usePageShell } from '@wepublish/website/builder';
import { useMemo } from 'react';

import {
  getLiveWebsiteShell,
  WebsiteShell,
  WebsiteShellProps,
} from '../lib/website-shell';

export const useWebsiteShell = (): WebsiteShell => {
  const matches = useRouterState({ select: state => state.matches });
  const livePage = usePageShell();

  return useMemo(() => {
    const deepest = [...matches]
      .reverse()
      .find(
        match => (match.loaderData as WebsiteShellProps | undefined)?.shell
      );

    return getLiveWebsiteShell(
      deepest?.loaderData as WebsiteShellProps | undefined,
      livePage
    );
  }, [matches, livePage]);
};
