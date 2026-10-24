import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { useRegister, useUser } from '@wepublish/authentication/website';

import { PropsWithChildren } from 'react';
import { SubscribeBlockContext } from './subscribe-block.context';
import {
  CreateSubscriptionInfoDocument,
  InvoicesDocument,
  ResubscribeDocument,
  SubscriptionsDocument,
  UpgradeSubscriptionInfoDocument,
} from '@wepublish/website/api';
import {
  usePurchaseGiftCode,
  useSubscribe,
  useUpgrade,
} from '@wepublish/payment/website';

export function SubscribeBlockProvider({ children }: PropsWithChildren) {
  const { hasUser } = useUser();

  const userSubscriptions = useQuery(SubscriptionsDocument, {
    skip: !hasUser,
  });
  const userInvoices = useQuery(InvoicesDocument, {
    skip: !hasUser,
  });
  const [subscribe, subscribeRedirectPages, subscribeStripeClientSecret] =
    useSubscribe();
  const [upgrade, upgradeRedirectPages, upgradeStripeClientSecret] =
    useUpgrade();
  const [purchaseGiftCode, giftCodeRedirectPages, giftCodeStripeClientSecret] =
    usePurchaseGiftCode();
  const upgradeInfo = useLazyQuery(UpgradeSubscriptionInfoDocument, {
    fetchPolicy: 'cache-first',
  });
  const subscribeInfo = useLazyQuery(CreateSubscriptionInfoDocument, {
    fetchPolicy: 'cache-first',
  });
  const { register, challenge } = useRegister();
  const resubscribe = useMutation(ResubscribeDocument);

  return (
    <SubscribeBlockContext.Provider
      value={{
        userSubscriptions,
        userInvoices,
        subscribe,
        upgrade,
        purchaseGiftCode,
        upgradeInfo,
        subscribeInfo,
        redirectPages:
          subscribeRedirectPages ??
          upgradeRedirectPages ??
          giftCodeRedirectPages,
        stripeClientSecret:
          subscribeStripeClientSecret ??
          upgradeStripeClientSecret ??
          giftCodeStripeClientSecret,
        register,
        challenge,
        resubscribe,
      }}
    >
      {children}
    </SubscribeBlockContext.Provider>
  );
}
