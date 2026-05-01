import { SubscriptionPage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsSubscriptionDetail } from '../../../../src/components/eenews-subscription-detail';

const Subscription = withAuthGuard(EenewsSubscriptionDetail) as NextPage;
Subscription.getInitialProps =
  SubscriptionPage.getInitialProps as NextPage['getInitialProps'];

export default Subscription;
