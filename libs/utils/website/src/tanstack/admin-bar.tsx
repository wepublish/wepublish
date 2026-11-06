import { useApolloClient } from '@apollo/client/react';
import { useRouterState } from '@tanstack/react-router';
import { useUser } from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { useSessionStorage } from '@wepublish/ui';
import { AdminBar, PREVIEW_MODE_KEY } from '@wepublish/website/admin';
import { useEffect, useMemo, useRef } from 'react';

import { useQueryParams } from './router-hooks';

/**
 * Replacement for `RoutedAdminBar` from `@wepublish/utils/website`.
 *
 * `router.events.on('routeChangeComplete')` has no TanStack counterpart;
 * subscribing to the resolved location through `useRouterState` and reacting to
 * changes gives the same "data is stale after a navigation" behaviour.
 */
const useRoutedPreviewMode = () => {
  const done = useRef(false);
  const client = useApolloClient();
  const query = useQueryParams();
  const { user } = useUser();

  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const isLoading = useRouterState({ select: state => state.isLoading });

  const canPreview = useMemo(
    () => user?.permissions.includes(CanPreview.id),
    [user?.permissions]
  );

  const [isPreview, , setPreviewMode] = useSessionStorage(PREVIEW_MODE_KEY, {
    serialize: value => Number(value).toString(),
    deserialize: value => !!Number(value),
  });

  useEffect(() => {
    if ('preview' in query && canPreview && !done.current) {
      setPreviewMode(true);
      done.current = true;
    }
  }, [canPreview, query, setPreviewMode]);

  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (isLoading || previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    if (isPreview && canPreview) {
      client.refetchObservableQueries();
    }
  }, [pathname, isLoading, isPreview, canPreview, client]);
};

export const RoutedAdminBar = () => {
  useRoutedPreviewMode();

  return <AdminBar />;
};
