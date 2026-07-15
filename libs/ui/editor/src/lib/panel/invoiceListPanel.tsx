import styled from '@emotion/styled';
import {
  InvoiceFragment,
  useMarkInvoiceAsPaidMutation,
  useMeQuery,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdDone, MdMail } from 'react-icons/md';
import { Button, Message, Modal, Table as RTable, toaster } from 'rsuite';
import { RowDataType } from 'rsuite/esm/Table';

import { createCheckedPermissionComponent } from '../atoms';

const { Column, HeaderCell, Cell: RCell } = RTable;

const MailIcon = styled(MdMail)`
  color: red;
  font-size: 1.5em;
  vertical-align: middle;
`;

const CloseIcon = styled(MdClose)`
  color: red;
  font-size: 1.5em;
  vertical-align: middle;
`;

const DoneIcon = styled(MdDone)`
  color: green;
  font-size: 1.5em;
  vertical-align: middle;
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
          <RCell dataKey="id" />
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
          width={190}
          resizable
        >
          <HeaderCell>{t('invoice.table.status')}</HeaderCell>
          <RCell>
            {(rowData: RowDataType<InvoiceFragment>) => {
              if (rowData.paidAt) {
                return (
                  <>
                    <DoneIcon /> {t('invoice.paidAt')}{' '}
                    {formatDate(rowData.paidAt)}
                  </>
                );
              }

              if (rowData.canceledAt) {
                return (
                  <>
                    <CloseIcon /> {t('invoice.canceledAt')}{' '}
                    {formatDate(rowData.canceledAt)}
                  </>
                );
              }

              return (
                <>
                  <MailIcon /> {t('invoice.unpaid')}
                </>
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
