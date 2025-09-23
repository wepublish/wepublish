import { StripeElement } from './stripe/stripe-element';
import { StripePayment } from './stripe/stripe-payment';

export type RedirectPages = {
  successUrl: string;
  failUrl: string;
};

type PaymentFormProps = {
  stripeClientSecret?: string | null;
  redirectPages?: RedirectPages | null;
};

export const PaymentForm = ({
  redirectPages,
  stripeClientSecret,
}: PaymentFormProps) => {
  if (!stripeClientSecret) {
    return null;
  }

  return (
    <StripeElement clientSecret={stripeClientSecret}>
      <StripePayment
        onClose={async success => {
          if (redirectPages) {
            window.location.href =
              success ? redirectPages.successUrl : redirectPages.failUrl;
          }
        }}
      />
    </StripeElement>
  );
};
