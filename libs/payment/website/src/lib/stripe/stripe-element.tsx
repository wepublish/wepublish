import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { PropsWithChildren, useMemo } from 'react';

export type StripeElementProps = {
  clientSecret?: string;
};

export function StripeElement({
  clientSecret,
  children,
}: PropsWithChildren<StripeElementProps>) {
  const {
    thirdParty: { stripe },
  } = useWebsiteBuilder();

  const stripePromise = useMemo(
    () => (stripe ? loadStripe(stripe) : null),
    [stripe]
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: 'de',
      }}
    >
      {children}
    </Elements>
  );
}
