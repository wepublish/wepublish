import { createFileRoute } from '@tanstack/react-router';
import { EenewsOpenInvoices, EenewsPageShell } from '@wepublish/tenant/eenews';
import { profileRoute, withAuthGuard } from '@wepublish/utils/website/tanstack';

/**
 * `pages/profile/rechnungen.tsx`.
 *
 * Shares `/profile`'s loader — the invoices it lists come from the same `Me`
 * and `Invoices` queries — and keeps the auth guard the Next page wrapped the
 * component in.
 */
export const Route = createFileRoute('/profile/rechnungen')({
  ...profileRoute(),
  component: withAuthGuard(Rechnungen),
  head: () => ({ meta: [{ title: 'Rechnungen | EE News' }] }),
});

function Rechnungen() {
  return (
    <EenewsPageShell>
      <EenewsOpenInvoices />
    </EenewsPageShell>
  );
}
