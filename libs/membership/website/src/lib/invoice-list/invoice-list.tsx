import { Skeleton } from '@mui/material';
import styled from '@emotion/styled';
import {
  BuilderInvoiceListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  InvoiceListItemContent,
  InvoiceListItemWrapper,
} from './invoice-list-item';
import { FullInvoiceFragment } from '@wepublish/website/api';

export const InvoiceListWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const isSepa = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.description === 'sepa';

export const isBexio = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.slug.includes('bexio');

export const isPayrexxSubscription = (invoice: FullInvoiceFragment) =>
  invoice.subscription?.paymentMethod.paymentProviderID ===
  'payrexx-subscription';

export const isInvoiceActive = (invoice: FullInvoiceFragment) =>
  !invoice.canceledAt && !invoice.paidAt && !!invoice.subscription;

export const canPayInvoice = (invoice: FullInvoiceFragment) =>
  isInvoiceActive(invoice) && !isSepa(invoice) && !isBexio(invoice);

export const InvoiceList = ({
  data,
  loading,
  error,
  onPay,
  className,
}: BuilderInvoiceListProps) => {
  const {
    InvoiceListItem,
    elements: { Alert },
  } = useWebsiteBuilder();

  return (
    <InvoiceListWrapper className={className}>
      {loading && <Skeleton variant={'rectangular'} />}

      {!loading && !error && !data?.userInvoices?.length && (
        <InvoiceListItemWrapper>
          <InvoiceListItemContent>
            <strong>Keine offenen Rechnungen</strong>
          </InvoiceListItemContent>
        </InvoiceListItemWrapper>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {!loading &&
        data?.userInvoices?.map(invoice => (
          <InvoiceListItem
            key={invoice.id}
            {...invoice}
            isSepa={isSepa(invoice)}
            isBexio={isBexio(invoice)}
            isPayrexxSubscription={isPayrexxSubscription(invoice)}
            canPay={canPayInvoice(invoice)}
            pay={async () =>
              onPay?.(invoice.id, invoice.subscription!.paymentMethod.id)
            }
          />
        ))}
    </InvoiceListWrapper>
  );
};
