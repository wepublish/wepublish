import styled from '@emotion/styled';
import {
  getApiClientV2,
  InvoiceFragment,
  useMeQuery,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Drawer, Message } from 'rsuite';

import { createCheckedPermissionComponent, Invoice } from '../atoms';

const InvoiceWrapper = styled.div`
  margin-bottom: 10px;
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
  onClose,
  onInvoicePaid,
}: InvoiceListPanelProps) {
  const client = getApiClientV2();
  const { data: me } = useMeQuery({
    client,
  });
  const { t } = useTranslation();

  /**
   * UI helper functions
   */
  function invoiceHistoryView() {
    // missing subscription
    if (!subscriptionId) {
      return (
        <Drawer.Body>
          <Message type="error">
            {t('invoice.panel.missingSubscriptionId')}
          </Message>
        </Drawer.Body>
      );
    }
    // missing invoices
    if (!invoices?.length) {
      return (
        <Drawer.Body>
          <Message type="info">{t('invoice.panel.noInvoices')}</Message>
        </Drawer.Body>
      );
    }
    // iterate invoices
    return invoices?.map((invoice, invoiceId) => (
      <InvoiceWrapper key={invoiceId}>
        <Invoice
          subscriptionId={subscriptionId}
          invoice={invoice}
          me={me?.me}
          disabled={disabled}
          onInvoicePaid={() => onInvoicePaid()}
        />
      </InvoiceWrapper>
    ));
  }

  return <>{invoiceHistoryView()}</>;
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_INVOICES',
  'CAN_GET_INVOICE',
  'CAN_CREATE_INVOICE',
  'CAN_DELETE_INVOICE',
])(InvoiceListPanel);
export { CheckedPermissionComponent as InvoiceListPanel };
