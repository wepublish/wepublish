import { useUser } from '@wepublish/authentication/website';
import { useInvoicesQuery } from '@wepublish/website/api';
import { useMemo } from 'react';

export const useHasUnpaidInvoices = () => {
  const { hasUser } = useUser();
  const { data } = useInvoicesQuery({
    fetchPolicy: 'cache-first',
    skip: !hasUser,
  });

  return useMemo(
    () =>
      data?.invoices.some(invoice => !invoice.canceledAt && !invoice.paidAt),
    [data?.invoices]
  );
};
