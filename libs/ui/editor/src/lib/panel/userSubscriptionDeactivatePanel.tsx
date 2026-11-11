import styled from '@emotion/styled';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SubscriptionDeactivationReason } from '@wepublish/editor/api';
import {
  CanCancelSubscription,
  CanCreateSubscription,
} from '@wepublish/permissions';
import { useState } from 'react';
import { DatePicker } from '../atoms/datePicker';
import { useTranslation } from 'react-i18next';

import { createCheckedPermissionComponent } from '../atoms';

const Form = styled('form')`
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
        <Typography>
          {t('userSubscriptionEdit.deactivation.modalMessage.activated', {
            userName: displayName,
            userEmail,
          })}
        </Typography>
        <Stack
          spacing={3}
          sx={{ width: '100%' }}
        >
          <Stack
            spacing={3}
            sx={{ width: '100%' }}
          >
            <FormControl fullWidth>
              <FormLabel>
                {t('userSubscriptionEdit.deactivation.date')}
              </FormLabel>
              <DatePicker
                value={deactivationDate ?? null}
                onChange={value => setDeactivationDate(value)}
                fullWidth
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>
                {t('userSubscriptionEdit.deactivation.reason')}
              </FormLabel>
              <TextField
                select
                value={deactivationReason ?? ''}
                onChange={event => {
                  const value = event.target
                    .value as SubscriptionDeactivationReason;
                  setDeactivationReason(value);
                }}
                fullWidth
              >
                <MenuItem
                  key={SubscriptionDeactivationReason.None}
                  value={SubscriptionDeactivationReason.None}
                >
                  {t('userSubscriptionEdit.deactivation.reasonNone')}
                </MenuItem>

                <MenuItem
                  key={SubscriptionDeactivationReason.UserSelfDeactivated}
                  value={SubscriptionDeactivationReason.UserSelfDeactivated}
                >
                  {t(
                    'userSubscriptionEdit.deactivation.reasonUserSelfDeactivated'
                  )}
                </MenuItem>

                <MenuItem
                  key={SubscriptionDeactivationReason.InvoiceNotPaid}
                  value={SubscriptionDeactivationReason.InvoiceNotPaid}
                >
                  {t('userSubscriptionEdit.deactivation.reasonInvoiceNotPaid')}
                </MenuItem>

                <MenuItem
                  key={SubscriptionDeactivationReason.UserReplacedSubscription}
                  value={
                    SubscriptionDeactivationReason.UserReplacedSubscription
                  }
                >
                  {t(
                    'userSubscriptionEdit.deactivation.reasonUserReplacedSubscription'
                  )}
                </MenuItem>

                <MenuItem
                  key={SubscriptionDeactivationReason.Chargeback}
                  value={SubscriptionDeactivationReason.Chargeback}
                >
                  {t('userSubscriptionEdit.deactivation.reasonChargeback')}
                </MenuItem>
              </TextField>
            </FormControl>
            <Alert severity="info">
              {t('userSubscriptionEdit.deactivation.help')}
            </Alert>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={() => onClose()}
        >
          {t('articleEditor.panels.close')}
        </Button>

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
      </DialogActions>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateSubscription.id,
  CanCancelSubscription.id,
])(UserSubscriptionDeactivatePanel);
export { CheckedPermissionComponent as UserSubscriptionDeactivatePanel };
