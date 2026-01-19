import { useRegister } from '@wepublish/authentication/website';
import {
  PaymentForm,
  useSubscribe,
  useUpgrade,
} from '@wepublish/payment/website';
import {
  useResubscribeMutation,
  useUpgradeSubscriptionInfoLazyQuery,
} from '@wepublish/website/api';
import { BuilderSubscribeProps } from '@wepublish/website/builder';

import { ComponentProps, createContext, useContext } from 'react';

export type SubscribeBlockContextProps = {
  userSubscriptions: BuilderSubscribeProps['userSubscriptions'];
  userInvoices: BuilderSubscribeProps['userInvoices'];
  challenge: BuilderSubscribeProps['challenge'];

  subscribe: ReturnType<typeof useSubscribe>[0];
  upgrade: ReturnType<typeof useUpgrade>[0];
  resubscribe: ReturnType<typeof useResubscribeMutation>;
  upgradeInfo: ReturnType<typeof useUpgradeSubscriptionInfoLazyQuery>;
  register: ReturnType<typeof useRegister>['register'];

  redirectPages: ComponentProps<typeof PaymentForm>['redirectPages'];
  stripeClientSecret: ComponentProps<typeof PaymentForm>['stripeClientSecret'];
};

export const SubscribeBlockContext = createContext<SubscribeBlockContextProps>(
  {} as SubscribeBlockContextProps
);

export const useSubscribeBlock = () => {
  const subscribeBlock = useContext(SubscribeBlockContext);

  if (!Object.keys(subscribeBlock).length) {
    throw new Error('SubscribeBlockContext has not been fully provided.');
  }

  return subscribeBlock;
};
