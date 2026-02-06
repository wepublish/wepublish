import { useRegister, useUser } from '@wepublish/authentication/website';

import { PropsWithChildren } from 'react';
import { SubscribeBlockContext } from './subscribe-block.context';
import {
  useSubscriptionsQuery,
  useInvoicesQuery,
  useUpgradeSubscriptionInfoLazyQuery,
  useResubscribeMutation,
} from '@wepublish/website/api';
import { useSubscribe, useUpgrade } from '@wepublish/payment/website';

export function SubscribeBlockProvider({ children }: PropsWithChildren) {
  const { hasUser } = useUser();

  const userSubscriptions = useSubscriptionsQuery({
    skip: !hasUser,
  });
  const userInvoices = useInvoicesQuery({
    skip: !hasUser,
  });
  const [subscribe, subscribeRedirectPages, subscribeStripeClientSecret] =
    useSubscribe();
  const [upgrade, upgradeRedirectPages, upgradeStripeClientSecret] =
    useUpgrade();
  const upgradeInfo = useUpgradeSubscriptionInfoLazyQuery({
    fetchPolicy: 'cache-first',
  });
  const { register, challenge } = useRegister();
  const resubscribe = useResubscribeMutation();

  return (
    <SubscribeBlockContext.Provider
      value={{
        userSubscriptions,
        userInvoices,
        subscribe,
        upgrade,
        upgradeInfo,
        redirectPages: subscribeRedirectPages ?? upgradeRedirectPages,
        stripeClientSecret:
          subscribeStripeClientSecret ?? upgradeStripeClientSecret,
        register,
        challenge,
        resubscribe,
      }}
    >
      {children}
    </SubscribeBlockContext.Provider>
  );
}
