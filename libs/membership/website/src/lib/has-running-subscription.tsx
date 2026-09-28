import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { SubscriptionsDocument } from '@wepublish/website/api';
import { useMemo } from 'react';

export const useHasRunningSubscription = () => {
  const { hasUser } = useUser();
  const { data } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-first',
    skip: !hasUser,
  });

  return useMemo(
    () =>
      !!data?.userSubscriptions.find(
        subscription => !subscription.deactivation
      ),
    [data?.userSubscriptions]
  );
};
