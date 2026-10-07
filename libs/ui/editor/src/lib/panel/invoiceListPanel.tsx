import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  InvoiceFragment,
  InvoicePaymentMailDocument,
  MarkInvoiceAsPaidDocument,
  MeDocument,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { MdAccessTime, MdClose, MdContentCopy, MdDone } from 'react-icons/md';
import {
  Button,
  Message,
  Modal,
  Notification,
  Panel as RPanel,
  Table as RTable,
  toaster,
  Tooltip,
  Whisper,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

import { createCheckedPermissionComponent } from '../atoms';
import { useActionMailQuestion } from '../hooks';
import { ColumnConfigurator } from '../listView/column-configurator';
import { ListColumn, renderListColumns } from '../listView/list-columns';
import { useColumnConfig } from '../listView/use-column-config';

const { Column, HeaderCell, Cell: RCell } = RTable;

const InvoiceIconWrapper = styled('span')`
  position: relative;
  display: inline-flex;
  vertical-align: middle;
`;

const InvoiceIcon = styled(LiaFileInvoiceSolid)`
  color: grey;
  font-size: 26px;
`;

const StatusPill = styled('span')<{ pillColor: string }>`
  position: absolute;
  right: -5px;
  top: 55%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${({ pillColor }) => pillColor};
  color: white;
  font-size: 10px;
  box-shadow: 0 0 0 2px white;
`;

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

const findGoodieItem = (invoice: InvoiceFragment) =>
  invoice.items?.find(({ goodieId }) => goodieId);

const PanelHeader = styled('div')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

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
  const { data: me } = useQuery(MeDocument, {});
  const { t } = useTranslation();
  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceFragment>();
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const columns = useMemo<ListColumn<InvoiceFragment>[]>(
    () => [
      {
        id: 'id',
        label: t('invoice.invoiceNo'),
        width: 110,
        render: invoice => (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>{invoice.id}</Tooltip>}
          >
            <IdButton
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(invoice.id);
                toaster.push(
                  <Notification
                    type="success"
                    header={t('invoice.table.idCopied')}
                    duration={2000}
                  />,
                  { placement: 'topEnd' }
                );
              }}
            >
              {invoice.id.slice(0, 4)}…
              <MdContentCopy />
            </IdButton>
          </Whisper>
        ),
      },
      {
        id: 'date',
        label: t('invoice.table.date'),
        width: 100,
        alwaysVisible: true,
        render: invoice => formatDate(invoice.createdAt),
      },
      {
        id: 'description',
        label: t('invoice.table.description'),
        flexGrow: 1,
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
        alwaysVisible: true,
        render: invoice => {
          const status =
            invoice.paidAt ?
              {
                title: `${t('invoice.paidAt')} ${formatDate(invoice.paidAt)}`,
                color: '#22c55e',
                icon: <MdDone />,
              }
            : invoice.canceledAt ?
              {
                title: `${t('invoice.canceledAt')} ${formatDate(invoice.canceledAt)}`,
                color: '#ef4444',
                icon: <MdClose />,
              }
            : {
                title: t('invoice.unpaid'),
                color: '#eab308',
                icon: <MdAccessTime />,
              };

          return (
            <Whisper
              placement="top"
              trigger="hover"
              speaker={<Tooltip>{status.title}</Tooltip>}
            >
              <InvoiceIconWrapper>
                <InvoiceIcon />

                <StatusPill pillColor={status.color}>{status.icon}</StatusPill>
              </InvoiceIconWrapper>
            </Whisper>
          );
        },
      },
    ],
    [t]
  );

  const { isVisible, toggle, configurableColumns } = useColumnConfig(
    'subscription-invoices',
    columns
  );

  const [markInvoiceAsPaid] = useMutation(MarkInvoiceAsPaidDocument);

  function closePayModal() {
    setInvoiceToPay(undefined);
  }

  async function payManually() {
    const invoice = invoiceToPay;
    setInvoiceToPay(undefined);

    if (!me?.me?.id) {
      toaster.push(
        <Message type="error">{t('invoice.userNotLoaded')}</Message>
      );

      return;
    }

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

  const panelHeader = (
    <PanelHeader>
      {t('invoice.panel.invoiceHistory')}

      <ColumnConfigurator
        columns={configurableColumns}
        isVisible={isVisible}
        onToggle={toggle}
      />
    </PanelHeader>
  );

  if (!subscriptionId) {
    return (
      <RPanel
        bordered
        header={panelHeader}
      >
        <Message type="error">
          {t('invoice.panel.missingSubscriptionId')}
        </Message>
      </RPanel>
    );
  }

  if (!invoices?.length) {
    return (
      <RPanel
        bordered
        header={panelHeader}
      >
        <Message type="info">{t('invoice.panel.noInvoices')}</Message>
      </RPanel>
    );
  }

  return (
    <RPanel
      bordered
      header={panelHeader}
    >
      <RTable
        autoHeight
        wordWrap="break-word"
        data={invoices}
      >
        {renderListColumns(columns, isVisible)}

        <Column width={160}>
          <HeaderCell>{t('invoice.table.action')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) =>
              !rowData.paidAt && !rowData.canceledAt ?
                <Button
                  size="xs"
                  appearance="primary"
                  disabled={!me?.me?.id || disabled}
                  onClick={() => setInvoiceToPay(rowData as InvoiceFragment)}
                >
                  {t('invoice.payManually')}
                </Button>
              : null
            }
          </RCell>
        </Column>
      </RTable>

      <Modal
        open={!!invoiceToPay}
        backdrop="static"
        size="xs"
        onClose={closePayModal}
      >
        <Modal.Title>{t('invoice.areYouSure')}</Modal.Title>
        <Modal.Body>{t('invoice.manuallyPaidModalBody')}</Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={payManually}
          >
            {t('confirm')}
          </Button>
          <Button
            appearance="subtle"
            onClick={closePayModal}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {actionMailDialog}
    </RPanel>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_INVOICES',
  'CAN_GET_INVOICE',
  'CAN_CREATE_INVOICE',
  'CAN_DELETE_INVOICE',
])(InvoiceListPanel);
export { CheckedPermissionComponent as InvoiceListPanel };
