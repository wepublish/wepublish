import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { DeactivatedSubscriptionsPage } from '@wepublish/utils/website/next';

export default function DeactivatedSubscriptions() {
  return (
    <Container>
      <DeactivatedSubscriptionsPage />
    </Container>
  );
}

DeactivatedSubscriptions.getInitialProps =
  DeactivatedSubscriptionsPage.getInitialProps;
