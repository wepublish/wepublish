import { SubscribePage } from '@wepublish/utils/website';

export default function Mitmachen() {
  return <SubscribePage fields={['firstName']} />;
}

Mitmachen.getInitialProps = SubscribePage.getInitialProps;
