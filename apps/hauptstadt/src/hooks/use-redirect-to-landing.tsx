import { useUser } from '@wepublish/authentication/website';
import { FullPageFragment } from '@wepublish/website/api';
import { useRouter } from 'next/router';
import { anyPass } from 'ramda';
import { useMemo } from 'react';

import { useIsFirstRoute } from './use-is-first';

export const useRedirectToLandingPage = (
  page?: FullPageFragment
): [false, string | null | undefined] | [true, string] => {
  const { user, hasUser } = useUser();
  const router = useRouter();
  const isFirstRoute = useIsFirstRoute();
  const property = useMemo(
    () =>
      page?.latest.properties.find(({ key }) => key === 'redirect-to-landing'),
    [page?.latest.properties]
  );

  const url = property?.value;

  const shouldNotRedirect = anyPass([
    () => !url,
    // Not on client
    () => !router.isReady,
    // User is logged in or it's being checked if the user is logged in
    () => hasUser || user === undefined,
    // Check if first page hit
    () => !isFirstRoute,
  ])();

  if (shouldNotRedirect) {
    return [false, url];
  }

  return [true, url!];
};
