import { useUser } from '@wepublish/authentication/website';
import { useSubscriptionsQuery } from '@wepublish/website/api';
import { useMemo } from 'react';

export const useActiveSubscriptions = () => {
  const { hasUser } = useUser();
  const { data } = useSubscriptionsQuery({
    fetchPolicy: 'cache-first',
    skip: !hasUser,
  });

  const subscriptions = useMemo(
    () => data?.subscriptions.filter(({ isActive }) => isActive),
    [data?.subscriptions]
  );

  if (!data?.subscriptions) {
    // return null so we know if it hasn't been loaded yet
    return null;
  }

  return subscriptions;
};

export const useHasActiveSubscription = () => {
  const runningSubscriptions = useActiveSubscriptions();

  return !!runningSubscriptions?.length;
};
