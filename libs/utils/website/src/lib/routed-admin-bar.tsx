import { useApolloClient } from '@apollo/client';
import { useUser } from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { useSessionStorage } from '@wepublish/ui';
import { AdminBar, PREVIEW_MODE_KEY } from '@wepublish/website/admin';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef } from 'react';

const useRoutedPreviewMode = () => {
  const done = useRef(false);
  const client = useApolloClient();
  const router = useRouter();
  const { user } = useUser();
  const canPreview = useMemo(
    () => user?.permissions.includes(CanPreview.id),
    [user?.permissions]
  );

  const [isPreview, , setPreviewMode] = useSessionStorage(PREVIEW_MODE_KEY, {
    serialize: value => Number(value).toString(),
    deserialize: value => !!Number(value),
  });

  useEffect(() => {
    if (
      router.isReady &&
      'preview' in router.query &&
      canPreview &&
      !done.current
    ) {
      setPreviewMode('preview' in router.query);
      done.current = true;
    }
  }, [canPreview, router.isReady, router.query, setPreviewMode]);

  useEffect(() => {
    const reloadData = () => {
      if (isPreview && canPreview) {
        client.reFetchObservableQueries();
      }
    };

    router.events.on('routeChangeComplete', reloadData);

    return () => {
      router.events.off('routeChangeComplete', reloadData);
    };
  }, [canPreview, client, isPreview, router.events]);
};

export const RoutedAdminBar = () => {
  useRoutedPreviewMode();

  return <AdminBar />;
};
