import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  InvoiceFragment,
  InvoicePaymentMailDocument,
  MarkInvoiceAsPaidDocument,
} from '@wepublish/editor/api';
import {
  CanCreateInvoice,
  CanDeleteInvoice,
  CanGetInvoice,
  CanGetInvoices,
} from '@wepublish/permissions';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';

import {
  createCheckedPermissionComponent,
  InvoiceStatus,
  InvoiceStatusIcon,
  SingleLineTooltip,
} from '../atoms';
import { useActionMailQuestion } from '../hooks';
import { DataTable } from '../listView/data-table';
import { ListColumn } from '../listView/list-columns';
import { enqueueSnackbar } from '../snackbar';

const IdButton = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font: inherit;
`;

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('de-CH', {
    timeZone: 'europe/zurich',
  });

const billingDate = (invoice: Pick<InvoiceFragment, 'createdAt' | 'dueAt'>) =>
  invoice.dueAt ?? invoice.createdAt;

export const sortByBillingDate = <
  T extends Pick<InvoiceFragment, 'createdAt' | 'dueAt'>,
>(
  invoices: T[],
  sortType: 'asc' | 'desc' = 'desc'
) =>
  [...invoices].sort((a, b) => {
    const difference =
      new Date(billingDate(a)).getTime() - new Date(billingDate(b)).getTime();

    return sortType === 'asc' ? difference : -difference;
  });

const findGoodieItem = (invoice: InvoiceFragment) =>
  invoice.items?.find(({ goodieId }) => goodieId);

export interface InvoiceListPanelProps {
  subscriptionId?: string;
  invoices?: InvoiceFragment[];
  disabled?: boolean;
  onClose?(): void;
  onSave?(): void;
  onInvoicePaid(): void;
}

function InvoiceListPanel({
  subscriptionId,
  invoices,
  disabled,
  onInvoicePaid,
}: InvoiceListPanelProps) {
  const { t } = useTranslation();
  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceFragment>();
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');
  const sortedInvoices = useMemo(
    () => sortByBillingDate(invoices ?? [], sortType),
    [invoices, sortType]
  );
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const columns = useMemo<ListColumn<InvoiceFragment>[]>(() => {
    const invoiceStatus = (
      invoice: InvoiceFragment
    ): { status: InvoiceStatus; title: string } =>
      invoice.paidAt ?
        {
          status: 'paid',
          title: `${t('invoice.paidAt')} ${formatDate(invoice.paidAt)}`,
        }
      : invoice.canceledAt ?
        {
          status: 'canceled',
          title: `${t('invoice.canceledAt')} ${formatDate(invoice.canceledAt)}`,
        }
      : { status: 'unpaid', title: t('invoice.unpaid') };

    return [
      {
        id: 'id',
        label: t('invoice.invoiceNo'),
        width: 110,
        render: invoice => (
          <SingleLineTooltip
            title={invoice.id}
            placement="top"
          >
            <IdButton
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(invoice.id);
                enqueueSnackbar(t('invoice.table.idCopied'), {
                  variant: 'success',
                  autoHideDuration: 2000,
                });
              }}
            >
              {invoice.id.slice(0, 4)}…
              <MdContentCopy />
            </IdButton>
          </SingleLineTooltip>
        ),
        exportValue: invoice => invoice.id,
      },
      {
        id: 'date',
        label: t('invoice.table.date'),
        width: 100,
        alwaysVisible: true,
        sortable: true,
        dataKey: 'dueAt',
        sortKey: 'dueAt',
        render: invoice => formatDate(billingDate(invoice)),
        exportValue: invoice => new Date(billingDate(invoice)),
      },
      {
        id: 'description',
        label: t('invoice.table.description'),
        width: 260,
        minWidth: 160,
        resizable: false,
        alwaysVisible: true,
        render: invoice => invoice.description,
      },
      {
        id: 'total',
        label: t('invoice.total'),
        width: 110,
        alwaysVisible: true,
        render: invoice =>
          `${(invoice.total / 100).toFixed(2)} ${invoice.currency}`,
      },
      {
        id: 'goodie',
        label: t('invoice.table.goodie'),
        width: 140,
        render: invoice => {
          const goodieItem = findGoodieItem(invoice);

          return goodieItem?.goodie?.name ?? goodieItem?.name ?? '—';
        },
      },
      {
        id: 'status',
        label: t('invoice.table.status'),
        width: 80,
        resizable: false,
        alwaysVisible: true,
        render: invoice => {
          const status = invoiceStatus(invoice);

          return (
            <InvoiceStatusIcon
              status={status.status}
              title={status.title}
            />
          );
        },
        exportValue: invoice => invoiceStatus(invoice).title,
      },
      {
        id: 'action',
        label: t('action'),
        width: 160,
        align: 'center',
        fixed: true,
        render: (invoice: InvoiceFragment) =>
          !invoice.paidAt && !invoice.canceledAt ?
            <Button
              size="small"
              variant="contained"
              disabled={disabled}
              onClick={() => setInvoiceToPay(invoice)}
            >
              {t('invoice.payManually')}
            </Button>
          : null,
      },
    ];
  }, [disabled, t]);

  const [markInvoiceAsPaid] = useMutation(MarkInvoiceAsPaidDocument);

  function closePayModal() {
    setInvoiceToPay(undefined);
  }

  async function payManually() {
    const invoice = invoiceToPay;
    setInvoiceToPay(undefined);

    if (!invoice) {
      return;
    }

    const { data } = await client.query({
      query: InvoicePaymentMailDocument,
      variables: { invoiceId: invoice.id },
      fetchPolicy: 'network-only',
    });

    const mail = data?.invoicePaymentMail;

    if (!mail) {
      throw new Error('Could not look up the mail of this action');
    }

    // asked every time: whether the mail goes out, or that none will
    const decision = await askMail({
      ...mail,
      recipient: mail.recipientEmail ?? invoice.mail,
    });

    if (decision === 'cancel') {
      return;
    }

    await markInvoiceAsPaid({
      variables: {
        id: invoice.id,
        // only set when the admin chose; otherwise the API default applies
        ...((decision === 'send' || decision === 'skip') && {
          sendMail: decision === 'send',
        }),
      },
    });

    onInvoicePaid();
  }

  const panelTitle = t('invoice.panel.invoiceHistory');

  if (!subscriptionId) {
    return (
      <Card>
        <CardHeader title={panelTitle} />

        <CardContent>
          <Alert severity="error">
            {t('invoice.panel.missingSubscriptionId')}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!invoices?.length) {
    return (
      <Card>
        <CardHeader title={panelTitle} />

        <CardContent>
          <Alert severity="info">{t('invoice.panel.noInvoices')}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={panelTitle} />

      <CardContent>
        <DataTable
          data={sortedInvoices}
          sortable={['dueAt']}
          sortColumn="dueAt"
          sortOrder={sortType}
          onSort={(_column, order) => setSortType(order)}
          getRowId={row => row.id}
          storageKey="invoices"
          exportRows={() => sortedInvoices}
          columns={columns}
        />
      </CardContent>

      <Dialog
        open={!!invoiceToPay}
        onClose={closePayModal}
        maxWidth="xs"
      >
        <DialogTitle>{t('invoice.areYouSure')}</DialogTitle>
        <DialogContent>{t('invoice.manuallyPaidModalBody')}</DialogContent>

        <DialogActions>
          <Button onClick={closePayModal}>{t('cancel')}</Button>

          <Button
            variant="contained"
            onClick={payManually}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {actionMailDialog}
    </Card>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetInvoices.id,
  CanGetInvoice.id,
  CanCreateInvoice.id,
  CanDeleteInvoice.id,
])(InvoiceListPanel);
export { CheckedPermissionComponent as InvoiceListPanel };
