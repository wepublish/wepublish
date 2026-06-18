import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';

import { EenewsOpenInvoices } from '../../src/components/eenews-open-invoices';
import { EenewsPageShell } from '../../src/components/eenews-page-shell';

function Rechnungen() {
  return (
    <EenewsPageShell>
      <EenewsOpenInvoices />
    </EenewsPageShell>
  );
}

const GuardedRechnungen = withAuthGuard(Rechnungen);
GuardedRechnungen.getInitialProps = ProfilePage.getInitialProps;

export default GuardedRechnungen;
