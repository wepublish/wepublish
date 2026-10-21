import { EenewsOpenInvoices, EenewsPageShell } from '@wepublish/tenant/eenews';
import { ProfilePage, withAuthGuard } from '@wepublish/utils/website';
import { NextPage } from 'next';

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
