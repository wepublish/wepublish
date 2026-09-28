import { SubscriptionPage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsPageShell } from '../../../src/components/eenews-page-shell';
import { EenewsSubscriptionDetail } from '../../../src/components/eenews-subscription-detail';

function Subscription() {
  return (
    <EenewsPageShell>
      <EenewsSubscriptionDetail />
    </EenewsPageShell>
  );
}

const GuardedSubscription = withAuthGuard(Subscription) as NextPage;
GuardedSubscription.getInitialProps = (
  SubscriptionPage as unknown as NextPage
).getInitialProps;

export default GuardedSubscription;
