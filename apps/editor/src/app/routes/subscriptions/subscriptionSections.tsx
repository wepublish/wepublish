import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  type FullMemberPlanFragment,
  InvoicesDocument,
  RenewSubscriptionDocument,
} from '@wepublish/editor/api';
import type { SectionComponentProps } from '@wepublish/form/editor';
import { enqueueSnackbar, humanizeError, InvoiceListPanel } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAutoFixHigh, MdCheck } from 'react-icons/md';

import type { SubscriptionValues } from './subscription.schema';
import { useSubscription } from './subscriptionContext';

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function PendingPaymentMethodChange() {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const change =
    subscription === null ? null : subscription.pendingPaymentMethodChange;

  return change === null ? null : (
      <Alert severity="info">
        {t('userSubscriptionEdit.paymentMethodChange.pending', {
          paymentMethod: change.paymentMethod.name,
          waitingFor: t(
            `userSubscriptionEdit.paymentMethodChange.waitingFor.${change.kind}`
          ),
          expiresAt: new Date(change.expiresAt),
        })}
      </Alert>
    );
}

function TrialSetup({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation();
  const { setValue } = useFormContext<SubscriptionValues>();
  const memberPlan: FullMemberPlanFragment | null | undefined = useWatch({
    name: 'memberPlan',
  });
  const [autoRenew, extendable]: [boolean, boolean] = useWatch({
    name: ['autoRenew', 'extendable'],
  });

  if (!memberPlan?.maxCount) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {t('subscriptionEditView.subscriptionTrialNotPossible')}
      </Typography>
    );
  }

  if (!autoRenew && !extendable) {
    return (
      <Alert
        icon={<MdCheck />}
        severity="success"
      >
        {t('subscriptionEditView.trialSubscriptionConfigured')}
      </Alert>
    );
  }

  return (
    <Actions>
      <Button
        variant="outlined"
        color="success"
        disabled={readOnly}
        startIcon={<MdAutoFixHigh />}
        onClick={() => {
          setValue('autoRenew', false, { shouldDirty: true });
          setValue('extendable', false, { shouldDirty: true });
        }}
      >
        {t('subscriptionEditView.configureAsTrialSubscription')}
      </Button>
    </Actions>
  );
}

function RenewNow({ readOnly }: { readOnly: boolean }) {
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const extendable: boolean = useWatch({ name: 'extendable' });
  const [asking, setAsking] = useState(false);
  const [renewSubscription, { loading }] = useMutation(
    RenewSubscriptionDocument,
    { refetchQueries: [InvoicesDocument] }
  );

  if (subscription === null || !extendable) {
    return null;
  }

  const renew = async () => {
    setAsking(false);

    try {
      await renewSubscription({ variables: { id: subscription.id } });
    } catch (error) {
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <>
      <Actions>
        <Button
          variant="outlined"
          disabled={readOnly}
          loading={loading}
          onClick={() => setAsking(true)}
        >
          {t('userSubscriptionEdit.renewNow')}
        </Button>
      </Actions>

      <Dialog
        fullWidth
        open={asking}
        maxWidth="sm"
        onClose={() => setAsking(false)}
      >
        <DialogTitle>{t('subscriptionEditView.extendModalTitle')}</DialogTitle>
        <DialogContent>{t('subscriptionEditView.extendModalBody')}</DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setAsking(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={renew}
          >
            {t('userSubscriptionEdit.renewNow')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function RenewalActions({ readOnly }: SectionComponentProps) {
  return (
    <>
      <TrialSetup readOnly={readOnly} />
      <RenewNow readOnly={readOnly} />
    </>
  );
}

export function SubscriptionInvoices() {
  const { subscription, reload } = useSubscription();
  const id = subscription === null ? undefined : subscription.id;
  const { data, error, refetch } = useQuery(InvoicesDocument, {
    variables: { take: 100, filter: { subscriptionID: id } },
    skip: id === undefined,
  });

  if (error !== undefined) {
    return <Alert severity="error">{humanizeError(error)}</Alert>;
  }

  return (
    <InvoiceListPanel
      subscriptionId={id}
      invoices={data?.invoices.nodes}
      disabled={subscription !== null && subscription.deactivation !== null}
      onInvoicePaid={() => {
        reload();
        void refetch();
      }}
    />
  );
}
