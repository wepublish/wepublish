import { SubscriptionPage, withAuthGuard } from '@wepublish/utils/website';

import { EenewsPageShell } from '../../../src/components/eenews-page-shell';
import { EenewsSubscriptionDetail } from '../../../src/components/eenews-subscription-detail';

function Subscription() {
  return (
    <EenewsPageShell>
      <EenewsSubscriptionDetail />
    </EenewsPageShell>
  );
}

const GuardedSubscription = withAuthGuard(Subscription);
GuardedSubscription.getInitialProps = (
  SubscriptionPage as unknown as {
    getInitialProps: (ctx: unknown) => Promise<Record<string, unknown>>;
  }
).getInitialProps;

export default GuardedSubscription;
