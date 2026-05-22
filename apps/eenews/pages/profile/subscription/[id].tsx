import { SubscriptionPage } from '@wepublish/utils/website';

import { EenewsPageShell } from '../../../src/components/eenews-page-shell';

const SubPage = SubscriptionPage as any;

export default function Subscription(props: Record<string, unknown>) {
  return (
    <EenewsPageShell>
      <SubPage {...props} />
    </EenewsPageShell>
  );
}

Subscription.getInitialProps = SubPage.getInitialProps;
