import { Elements } from '@stripe/react-stripe-js';
import { StripeElementLocale } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js/pure';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();

  const stripePromise = useMemo(
    () => (stripe ? loadStripe(stripe) : null),
    [stripe]
  );

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        locale: i18n.language as StripeElementLocale,
      }}
    >
      {children}
    </Elements>
  );
}
