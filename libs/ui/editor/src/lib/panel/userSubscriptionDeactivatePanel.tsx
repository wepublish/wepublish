import styled from '@emotion/styled';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { SubscriptionDeactivationReason } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker, Form as RForm, SelectPicker } from 'rsuite';

import { createCheckedPermissionComponent } from '../atoms';

const { Group, Label } = RForm;

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
      <DialogTitle>
        {t('userSubscriptionEdit.deactivation.modalTitle.activated')}
      </DialogTitle>

      <DialogContent>
        <p>
          {t('userSubscriptionEdit.deactivation.modalMessage.activated', {
            userName: displayName,
            userEmail,
          })}
        </p>
        <Form>
          <RForm.Stack fluid>
            <Group controlId="deactivationDate">
              <Label>{t('userSubscriptionEdit.deactivation.date')}</Label>
              <DatePicker
                block
                oneTap
                placement="auto"
                value={deactivationDate}
                onChange={value => setDeactivationDate(value)}
              />
            </Group>

            <Group controlId="deactivationReason">
              <Label>{t('userSubscriptionEdit.deactivation.reason')}</Label>
              <SelectPicker
                block
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
                  {
                    value: SubscriptionDeactivationReason.Chargeback,
                    label: t(
                      'userSubscriptionEdit.deactivation.reasonChargeback'
                    ),
                  },
                ]}
                value={deactivationReason}
                placement="auto"
                onChange={value => setDeactivationReason(value)}
              />
            </Group>
            <Alert severity="info">
              {t('userSubscriptionEdit.deactivation.help')}
            </Alert>
          </RForm.Stack>
        </Form>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          disabled={!deactivationDate || !deactivationReason}
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
          variant="text"
          onClick={() => onClose()}
        >
          {t('articleEditor.panels.close')}
        </Button>
      </DialogActions>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_CREATE_SUBSCRIPTION',
  'CAN_DELETE_SUBSCRIPTION',
])(UserSubscriptionDeactivatePanel);
export { CheckedPermissionComponent as UserSubscriptionDeactivatePanel };
