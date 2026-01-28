import { DeactivatedSubscriptionsPage } from '@wepublish/utils/website';

import { Container } from '../../../src/components/layout/container';

export default function DeactivatedSubscriptions() {
  return (
    <Container>
      <DeactivatedSubscriptionsPage />
    </Container>
  );
}

DeactivatedSubscriptions.getInitialProps =
  DeactivatedSubscriptionsPage.getInitialProps;
