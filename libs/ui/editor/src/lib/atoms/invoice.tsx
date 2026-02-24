import styled from '@emotion/styled';
import {
  FullUserFragment,
  InvoiceFragment,
  useMarkInvoiceAsPaidMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdClose, MdDone, MdMail } from 'react-icons/md';
import {
  Button as RButton,
  FlexboxGrid,
  Message,
  Modal,
  Panel,
  toaster,
} from 'rsuite';

const Button = styled(RButton)`
  margin-top: 20px;
`;

const MailIcon = styled(MdMail)`
  color: red;
  font-size: 2em;
`;

const CloseIcon = styled(MdClose)`
  color: red;
  font-size: 2em;
`;

const DoneIcon = styled(MdDone)`
  color: green;
  font-size: 2em;
`;

const FlexboxItem = styled(FlexboxGrid.Item)`
  text-align: right;
`;

export interface InvoiceProps {
  subscriptionId: string;
  invoice: InvoiceFragment;
  me?: FullUserFragment | null;
  disabled?: boolean;
  onInvoicePaid(): void;
}

export function Invoice({
  subscriptionId,
  invoice,
  me,
  disabled,
  onInvoicePaid,
}: InvoiceProps) {
  // variable definitions
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [markInvoiceAsPaid] = useMarkInvoiceAsPaidMutation();
  const { t } = useTranslation();

  /**
   * Manually set invoice as paid.
   * This will trigger an update event in events.ts which updates the subscriptions "paid until".
   */
  async function payManually() {
    // close modal
    setModalOpen(false);
    // error pre-check
    const myId = me?.id;
    if (!myId) {
      toaster.push(
        <Message type="error">{t('invoice.userNotLoaded')}</Message>
      );
      return;
    }

    await markInvoiceAsPaid({
      variables: {
        id: invoice.id,
      },
    });
    onInvoicePaid();
  }

  /**
   * UI helper functions
   */
  function invoiceActionView() {
    if (invoice.paidAt) {
      return (
        <p>
          {t('invoice.paidAt')}{' '}
          {new Date(invoice.paidAt).toLocaleString('de-CH', {
            timeZone: 'europe/zurich',
          })}
        </p>
      );
    } else if (invoice.canceledAt) {
      return (
        <p>
          {t('invoice.canceledAt')}{' '}
          {new Date(invoice.canceledAt).toLocaleString('de-CH', {
            timeZone: 'europe/zurich',
          })}
        </p>
      );
    } else {
      return (
        <Button
          onClick={() => setModalOpen(true)}
          appearance="primary"
          disabled={!me?.id || disabled}
        >
          {t('invoice.payManually')}
        </Button>
      );
    }
  }

  function invoiceHeaderView() {
    return (
      <FlexboxGrid
        justify="space-between"
        align="middle"
      >
        <FlexboxGrid.Item>
          {`${t('invoice.invoiceNo')} ${invoice.id}`}{' '}
          {!invoice.paidAt && <span>{t('invoice.unpaid')}</span>}
        </FlexboxGrid.Item>
        <FlexboxItem>{invoiceIconView()}</FlexboxItem>
      </FlexboxGrid>
    );
  }

  function invoiceIconView() {
    if (invoice.paidAt) {
      return <DoneIcon />;
    } else if (invoice.canceledAt) {
      return <CloseIcon />;
    } else {
      return <MailIcon />;
    }
  }

  return (
    <>
      <Panel
        bordered
        header={invoiceHeaderView()}
      >
        <p>{invoice.description}</p>
        <p>
          {t('invoice.total')} {(invoice.total / 100).toFixed(2)}{' '}
          {invoice.currency}
        </p>
        {invoiceActionView()}
      </Panel>

      <Modal
        open={modalOpen}
        backdrop="static"
        size="xs"
        onClose={() => setModalOpen(false)}
      >
        <Modal.Title>{t('invoice.areYouSure')}</Modal.Title>
        <Modal.Body>{t('invoice.manuallyPaidModalBody')}</Modal.Body>
        <Modal.Footer>
          <RButton
            appearance="primary"
            onClick={payManually}
          >
            {t('confirm')}
          </RButton>
          <RButton
            appearance="subtle"
            onClick={() => setModalOpen(false)}
          >
            {t('cancel')}
          </RButton>
        </Modal.Footer>
      </Modal>
    </>
  );
}
