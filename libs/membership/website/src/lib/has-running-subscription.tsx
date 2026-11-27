import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { SubscriptionsDocument } from '@wepublish/website/api';
import { useMemo } from 'react';

/** `skip` leaves the API alone, for a session it would refuse anyway. */
export const useHasRunningSubscription = ({
  skip = false,
}: { skip?: boolean } = {}) => {
  const { hasUser } = useUser();
  const { data } = useQuery(SubscriptionsDocument, {
    fetchPolicy: 'cache-first',
    skip: !hasUser || skip,
  });

  return useMemo(
    () =>
      !!data?.userSubscriptions.find(
        subscription => !subscription.deactivation
      ),
    [data?.userSubscriptions]
  );
};
