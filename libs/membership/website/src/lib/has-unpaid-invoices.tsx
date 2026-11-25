import { useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import { InvoicesDocument } from '@wepublish/website/api';
import { useMemo } from 'react';

import { isInvoiceDue } from './invoice-due';

/**
 * Whether the reader has an open invoice. With `dueOnly`, only one that asks
 * them to act now (see `isInvoiceDue`). `skip` leaves the API alone, for a
 * session it would refuse the invoices anyway.
 */
export const useHasUnpaidInvoices = ({
  dueOnly = false,
  skip = false,
}: { dueOnly?: boolean; skip?: boolean } = {}) => {
  const { hasUser } = useUser();
  const { data } = useQuery(InvoicesDocument, {
    fetchPolicy: 'cache-first',
    skip: !hasUser || skip,
  });

  const invoices = data?.userInvoices;

  return useMemo(
    () =>
      invoices?.some(invoice =>
        dueOnly ?
          isInvoiceDue(invoice, invoices)
        : !invoice.canceledAt && !invoice.paidAt
      ),
    [invoices, dueOnly]
  );
};
