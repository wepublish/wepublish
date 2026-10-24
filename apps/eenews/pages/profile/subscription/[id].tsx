import {
  EenewsPageShell,
  EenewsSubscriptionDetail,
} from '@wepublish/tenant/eenews';
import { SubscriptionPage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

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
