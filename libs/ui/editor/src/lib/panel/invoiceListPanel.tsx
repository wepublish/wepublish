import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  InvoiceFragment,
  MarkInvoiceAsPaidDocument,
  MeDocument,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LiaFileInvoiceSolid } from 'react-icons/lia';
import { MdAccessTime, MdClose, MdContentCopy, MdDone } from 'react-icons/md';
import {
  Button,
  Checkbox,
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
  box-shadow: 0 0 0 2px var(--rs-bg-card);
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

export interface SubscriptionPeriodRef {
  invoiceID: string;
  startsAt: string;
}

export function shouldOfferMailOptOut(
  periods: SubscriptionPeriodRef[] | undefined,
  invoiceId: string
): boolean {
  const invoicePeriod = periods?.find(period => period.invoiceID === invoiceId);

  if (!invoicePeriod) {
    return true;
  }

  const invoiceStart = new Date(invoicePeriod.startsAt).getTime();

  return (periods ?? []).some(
    period => new Date(period.startsAt).getTime() < invoiceStart
  );
}

export interface InvoiceListPanelProps {
  subscriptionId?: string;
  invoices?: InvoiceFragment[];
  periods?: SubscriptionPeriodRef[];
  disabled?: boolean;
  onClose?(): void;
  onSave?(): void;
  onInvoicePaid(): void;
}

function InvoiceListPanel({
  subscriptionId,
  invoices,
  periods,
  disabled,
  onInvoicePaid,
}: InvoiceListPanelProps) {
  const { data: me } = useQuery(MeDocument, {});
  const { t } = useTranslation();
  const [invoiceToPay, setInvoiceToPay] = useState<InvoiceFragment>();
  const [doNotSendMail, setDoNotSendMail] = useState(false);
  const offersMailOptOut =
    invoiceToPay ? shouldOfferMailOptOut(periods, invoiceToPay.id) : true;
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
                color: 'var(--rs-state-success)',
                icon: <MdDone />,
              }
            : invoice.canceledAt ?
              {
                title: `${t('invoice.canceledAt')} ${formatDate(invoice.canceledAt)}`,
                color: 'var(--rs-state-error)',
                icon: <MdClose />,
              }
            : {
                title: t('invoice.unpaid'),
                color: 'var(--rs-state-warning)',
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
    setDoNotSendMail(false);
  }

  async function payManually() {
    const invoiceId = invoiceToPay?.id;
    setInvoiceToPay(undefined);
    setDoNotSendMail(false);

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
        sendMail: !doNotSendMail,
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
        <Modal.Body>
          {t('invoice.manuallyPaidModalBody')}

          {offersMailOptOut ?
            <Checkbox
              checked={doNotSendMail}
              onChange={(value, checked) => setDoNotSendMail(checked)}
            >
              {t('invoice.doNotSendMail')}
            </Checkbox>
          : <p>{t('invoice.noMailForFirstPeriod')}</p>}
        </Modal.Body>
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
