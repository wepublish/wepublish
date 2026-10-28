import { EenewsPageShell } from '@wepublish/tenant/eenews';
import { DeactivatedSubscriptionsPage } from '@wepublish/utils/website/next';

const DeactPage = DeactivatedSubscriptionsPage as any;

export default function Deactivated(props: Record<string, unknown>) {
  return (
    <EenewsPageShell>
      <DeactPage {...props} />
    </EenewsPageShell>
  );
}

Deactivated.getInitialProps = DeactPage.getInitialProps;
