import { WelcomePage } from '@wepublish/utils/website';

export default function Welcome() {
  return <WelcomePage />;
}

Welcome.getInitialProps = WelcomePage.getInitialProps;
