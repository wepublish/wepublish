import styled from '@emotion/styled';
import {
  InvoiceFragment,
  useMarkInvoiceAsPaidMutation,
  useMeQuery,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { MdAccessTime, MdClose, MdContentCopy, MdDone } from 'react-icons/md';
import {
  Button,
  Message,
  Modal,
  Notification,
  Table as RTable,
  toaster,
  Tooltip,
  Whisper,
} from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

import { createCheckedPermissionComponent } from '../atoms';

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
  const { data: me } = useMeQuery({});
  const { t } = useTranslation();
  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceFragment>();

  const [markInvoiceAsPaid] = useMarkInvoiceAsPaidMutation();

  async function payManually() {
    const invoiceId = invoiceToPay?.id;
    setInvoiceToPay(undefined);

    if (!me?.me?.id) {
      toaster.push(
        <Message type="error">{t('invoice.userNotLoaded')}</Message>
      );

      return;
    }

    if (!invoiceId) {
      return;
    }

    await markInvoiceAsPaid({
      variables: {
        id: invoiceId,
      },
    });
    onInvoicePaid();
  }

  if (!subscriptionId) {
    return (
      <Message type="error">{t('invoice.panel.missingSubscriptionId')}</Message>
    );
  }

  if (!invoices?.length) {
    return <Message type="info">{t('invoice.panel.noInvoices')}</Message>;
  }

  return (
    <>
      <RTable
        autoHeight
        wordWrap="break-word"
        data={invoices}
      >
        <Column
          width={110}
          resizable
        >
          <HeaderCell>{t('invoice.invoiceNo')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) => (
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>{rowData.id}</Tooltip>}
              >
                <IdButton
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rowData.id);
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
                  {rowData.id.slice(0, 4)}…
                  <MdContentCopy />
                </IdButton>
              </Whisper>
            )}
          </RCell>
        </Column>

        <Column
          width={100}
          resizable
        >
          <HeaderCell>{t('invoice.table.date')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) =>
              formatDate(rowData.createdAt)
            }
          </RCell>
        </Column>

        <Column
          flexGrow={1}
          minWidth={160}
        >
          <HeaderCell>{t('invoice.table.description')}</HeaderCell>
          <RCell dataKey="description" />
        </Column>

        <Column
          width={110}
          resizable
        >
          <HeaderCell>{t('invoice.total')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) =>
              `${(rowData.total / 100).toFixed(2)} ${rowData.currency}`
            }
          </RCell>
        </Column>

        <Column
          width={140}
          resizable
        >
          <HeaderCell>{t('invoice.table.goodie')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) => {
              const goodieItem = findGoodieItem(rowData as InvoiceFragment);

              return goodieItem?.goodie?.name ?? goodieItem?.name ?? '—';
            }}
          </RCell>
        </Column>

        <Column
          width={80}
          resizable
        >
          <HeaderCell>{t('invoice.table.status')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) => {
              const status =
                rowData.paidAt ?
                  {
                    title: `${t('invoice.paidAt')} ${formatDate(rowData.paidAt)}`,
                    color: '#22c55e',
                    icon: <MdDone />,
                  }
                : rowData.canceledAt ?
                  {
                    title: `${t('invoice.canceledAt')} ${formatDate(rowData.canceledAt)}`,
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

                    <StatusPill pillColor={status.color}>
                      {status.icon}
                    </StatusPill>
                  </InvoiceIconWrapper>
                </Whisper>
              );
            }}
          </RCell>
        </Column>

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
        onClose={() => setInvoiceToPay(undefined)}
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
            onClick={() => setInvoiceToPay(undefined)}
          >
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_INVOICES',
  'CAN_GET_INVOICE',
  'CAN_CREATE_INVOICE',
  'CAN_DELETE_INVOICE',
])(InvoiceListPanel);
export { CheckedPermissionComponent as InvoiceListPanel };
