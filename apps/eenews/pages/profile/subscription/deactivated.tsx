import {
  DeactivatedSubscriptionsPage,
  withAuthGuard,
} from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsDeactivatedSubscriptions } from '../../../src/components/eenews-deactivated-subscriptions';

const Deactivated = withAuthGuard(EenewsDeactivatedSubscriptions) as NextPage;
Deactivated.getInitialProps =
  DeactivatedSubscriptionsPage.getInitialProps as NextPage['getInitialProps'];

export default Deactivated;
