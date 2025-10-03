import { useRegister, useUser } from '@wepublish/authentication/website';

import { PropsWithChildren } from 'react';
import { SubscribeBlockContext } from './subscribe-block.context';
import {
  useSubscriptionsQuery,
  useInvoicesQuery,
} from '@wepublish/website/api';
import { useSubscribe } from '@wepublish/payment/website';

export function SubscribeBlockProvider({ children }: PropsWithChildren) {
  const { hasUser } = useUser();

  const userSubscriptions = useSubscriptionsQuery({
    skip: !hasUser,
  });
  const userInvoices = useInvoicesQuery({
    skip: !hasUser,
  });
  const [subscribe, redirectPages, stripeClientSecret] = useSubscribe();
  const { register, challenge } = useRegister();

  return (
    <SubscribeBlockContext.Provider
      value={{
        userSubscriptions,
        userInvoices,
        subscribe,
        redirectPages,
        stripeClientSecret,
        register,
        challenge,
      }}
    >
      {children}
    </SubscribeBlockContext.Provider>
  );
}
