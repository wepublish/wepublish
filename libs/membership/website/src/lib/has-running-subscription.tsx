import { useUser } from '@wepublish/authentication/website';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import { useMemo } from 'react';

export const useHasRunningSubscription = () => {
  const { hasUser } = useUser();
  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-first',
    skip: !hasUser,
  });

  return useMemo(
    () =>
      !!data?.subscriptions.find(subscription => !subscription.deactivation),
    [data?.subscriptions]
  );
};
