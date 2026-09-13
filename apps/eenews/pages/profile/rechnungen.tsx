import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

import { EenewsOpenInvoices } from '../../src/components/eenews-open-invoices';
import { EenewsPageShell } from '../../src/components/eenews-page-shell';

function Rechnungen() {
  return (
    <EenewsPageShell>
      <EenewsOpenInvoices />
    </EenewsPageShell>
  );
}

const GuardedRechnungen = withAuthGuard(Rechnungen) as NextPage;
GuardedRechnungen.getInitialProps = (
  ProfilePage as unknown as NextPage
).getInitialProps;

export default GuardedRechnungen;
