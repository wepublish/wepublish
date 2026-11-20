import { WelcomePage } from '@wepublish/utils/website/next';

export default function Welcome() {
  return <WelcomePage />;
}

Welcome.getInitialProps = WelcomePage.getInitialProps;
