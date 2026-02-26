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
    () => data?.userSubscriptions.filter(({ isActive }) => isActive),
    [data?.userSubscriptions]
  );

  if (!data?.userSubscriptions) {
    // return null so we know if it hasn't been loaded yet
    return null;
  }

  return subscriptions;
};

export const useHasActiveSubscription = () => {
  const runningSubscriptions = useActiveSubscriptions();

  return !!runningSubscriptions?.length;
};
