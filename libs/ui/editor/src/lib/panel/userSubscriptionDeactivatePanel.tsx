import styled from '@emotion/styled';
import { SubscriptionDeactivationReason } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DatePicker,
  Form as RForm,
  Message,
  Modal,
  SelectPicker,
} from 'rsuite';

import { createCheckedPermissionComponent } from '../atoms';

const { Group, ControlLabel } = RForm;

const Form = styled(RForm)`
  margin-top: 20px;
`;

export interface DeactivateSubscription {
  date: Date;
  reason: SubscriptionDeactivationReason;
}

export interface SubscriptionDeactivatePanelProps {
  displayName: string;
  userEmail: string;
  paidUntil?: Date;

  onDeactivate(data: DeactivateSubscription): void;
  onClose(): void;
}

function UserSubscriptionDeactivatePanel({
  displayName,
  userEmail,
  paidUntil,
  onDeactivate,
  onClose,
}: SubscriptionDeactivatePanelProps) {
  const { t } = useTranslation();

  const [deactivationDate, setDeactivationDate] = useState<Date | null>(
    paidUntil ? new Date(paidUntil) : new Date()
  );
  const [deactivationReason, setDeactivationReason] =
    useState<SubscriptionDeactivationReason | null>(null);

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {t('userSubscriptionEdit.deactivation.modalTitle.activated')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          {t('userSubscriptionEdit.deactivation.modalMessage.activated', {
            userName: displayName,
            userEmail,
          })}
        </p>
        <Form fluid>
          <Group controlId="deactivationDate">
            <ControlLabel>
              {t('userSubscriptionEdit.deactivation.date')}
            </ControlLabel>
            <DatePicker
              block
              placement="auto"
              value={deactivationDate}
              onChange={value => setDeactivationDate(value)}
            />
          </Group>

          <Group controlId="deactivationReason">
            <ControlLabel>
              {t('userSubscriptionEdit.deactivation.reason')}
            </ControlLabel>
            <SelectPicker
              virtualized
              searchable={false}
              data={[
                {
                  value: SubscriptionDeactivationReason.None,
                  label: t('userSubscriptionEdit.deactivation.reasonNone'),
                },
                {
                  value: SubscriptionDeactivationReason.UserSelfDeactivated,
                  label: t(
                    'userSubscriptionEdit.deactivation.reasonUserSelfDeactivated'
                  ),
                },
                {
                  value: SubscriptionDeactivationReason.InvoiceNotPaid,
                  label: t(
                    'userSubscriptionEdit.deactivation.reasonInvoiceNotPaid'
                  ),
                },
                {
                  value:
                    SubscriptionDeactivationReason.UserReplacedSubscription,
                  label: t(
                    'userSubscriptionEdit.deactivation.reasonUserReplacedSubscription'
                  ),
                },
              ]}
              value={deactivationReason}
              block
              placement="auto"
              onChange={value => setDeactivationReason(value)}
            />
          </Group>
          <Message
            showIcon
            type="info"
          >
            {t('userSubscriptionEdit.deactivation.help')}
          </Message>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          disabled={!deactivationDate || !deactivationReason}
          appearance="primary"
          onClick={() =>
            onDeactivate({
              date: deactivationDate!,
              reason: deactivationReason!,
            })
          }
        >
          {t('userSubscriptionEdit.deactivation.action.activated')}
        </Button>
        <Button
          appearance="subtle"
          onClick={() => onClose()}
        >
          {t('articleEditor.panels.close')}
        </Button>
      </Modal.Footer>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION',
])(UserSubscriptionDeactivatePanel);
export { CheckedPermissionComponent as UserSubscriptionDeactivatePanel };
