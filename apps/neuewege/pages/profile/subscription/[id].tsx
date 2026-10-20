import { SubscriptionPage } from '@wepublish/utils/website';

export default function Subscription() {
  // readers may switch from invoice to online payment when renewing early
  return <SubscriptionPage allowPaymentMethodChoice />;
}

Subscription.getInitialProps = SubscriptionPage.getInitialProps;
