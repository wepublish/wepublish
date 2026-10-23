import { BajourContainer as Container } from '@wepublish/tenant/bajour';
import { SubscribePage } from '@wepublish/utils/website/next';

export default function Mitmachen() {
  return (
    <Container>
      <SubscribePage fields={['firstName']} />
    </Container>
  );
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
