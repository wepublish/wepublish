import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { SubscriptionPage } from '@wepublish/utils/website';

export default function Subscription() {
  return (
    <Container>
      <SubscriptionPage />
    </Container>
  );
}

Subscription.getInitialProps = SubscriptionPage.getInitialProps;
