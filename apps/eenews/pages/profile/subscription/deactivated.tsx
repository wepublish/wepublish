import { DeactivatedSubscriptionsPage } from '@wepublish/utils/website';

import { EenewsPageShell } from '../../../src/components/eenews-page-shell';

const DeactPage = DeactivatedSubscriptionsPage as any;

export default function Deactivated(props: Record<string, unknown>) {
  return (
    <EenewsPageShell>
      <DeactPage {...props} />
    </EenewsPageShell>
  );
}

Deactivated.getInitialProps = DeactPage.getInitialProps;
