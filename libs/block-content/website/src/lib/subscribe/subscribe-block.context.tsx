import { useRegister } from '@wepublish/authentication/website';
import {
  PaymentForm,
  useSubscribe,
  useUpgrade,
} from '@wepublish/payment/website';
import type { useLazyQuery, useMutation } from '@apollo/client/react';
import {
  ResubscribeMutation,
  ResubscribeMutationVariables,
  UpgradeSubscriptionInfoQuery,
  UpgradeSubscriptionInfoQueryVariables,
} from '@wepublish/website/api';
import { BuilderSubscribeProps } from '@wepublish/website/builder';

import { ComponentProps, createContext, useContext } from 'react';

export type SubscribeBlockContextProps = {
  userSubscriptions: BuilderSubscribeProps['userSubscriptions'];
  userInvoices: BuilderSubscribeProps['userInvoices'];
  challenge: BuilderSubscribeProps['challenge'];

  subscribeInfo: [
    BuilderSubscribeProps['fetchSubscribeInfo'],
    BuilderSubscribeProps['subscribeInfo'],
  ];

  subscribe: ReturnType<typeof useSubscribe>[0];
  upgrade: ReturnType<typeof useUpgrade>[0];
  resubscribe: useMutation.ResultTuple<
    ResubscribeMutation,
    ResubscribeMutationVariables
  >;
  upgradeInfo: useLazyQuery.ResultTuple<
    UpgradeSubscriptionInfoQuery,
    UpgradeSubscriptionInfoQueryVariables,
    'complete' | 'empty' | 'streaming'
  >;
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
