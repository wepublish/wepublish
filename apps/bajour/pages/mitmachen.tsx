import { SubscribePage } from '@wepublish/utils/website';

import { Container } from '../src/components/layout/container';

export default function Mitmachen() {
  return (
    <Container>
      <SubscribePage fields={['firstName']} />
    </Container>
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
