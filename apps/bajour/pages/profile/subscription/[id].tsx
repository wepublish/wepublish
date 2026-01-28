import { SubscriptionPage } from '@wepublish/utils/website';

import { Container } from '../../../src/components/layout/container';

export default function Subscription() {
  return (
    <Container>
      <SubscriptionPage />
    </Container>
  );
}

Subscription.getInitialProps = SubscriptionPage.getInitialProps;
