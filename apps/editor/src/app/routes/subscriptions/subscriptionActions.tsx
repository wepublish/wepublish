import { useApolloClient, useMutation } from '@apollo/client/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  type SubscriptionDeactivationReason,
  CancelSubscriptionDocument,
  InvoicesDocument,
  ReactivateSubscriptionDocument,
  RevertSubscriptionUpgradeDocument,
  SubscriptionCancellationMailDocument,
} from '@wepublish/editor/api';
import { CanCreateSubscription } from '@wepublish/permissions';
import {
  enqueueSnackbar,
  humanizeError,
  PermissionControl,
  skipMailFor,
  UserSubscriptionDeactivatePanel,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdRestartAlt, MdUndo, MdUnpublished } from 'react-icons/md';

import { ReactivateSubscriptionModal } from './reactivateSubscriptionModal';
import type { LoadedSubscription } from './subscription.schema';
import { useSubscription } from './subscriptionContext';

const actionPermissions = [CanCreateSubscription.id];

const refetchInvoices = { refetchQueries: [InvoicesDocument] };

type Dialogs = 'deactivate' | 'reactivate' | 'revert' | null;

const reportError = (error: unknown) =>
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });

async function reporting(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    reportError(error);
  }
}

export function SubscriptionActions() {
  const { subscription } = useSubscription();

  return subscription === null ? null : (
      <PermissionControl qualifyingPermissions={actionPermissions}>
        <LoadedSubscriptionActions subscription={subscription} />
      </PermissionControl>
    );
}

function LoadedSubscriptionActions({
  subscription,
}: {
  subscription: LoadedSubscription;
}) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { reload, askMail } = useSubscription();
  const [open, setOpen] = useState<Dialogs>(null);
  const [cancelSubscription] = useMutation(
    CancelSubscriptionDocument,
    refetchInvoices
  );
  const [reactivateSubscription, { loading: reactivating }] = useMutation(
    ReactivateSubscriptionDocument,
    refetchInvoices
  );
  const [revertSubscriptionUpgrade, { loading: reverting }] = useMutation(
    RevertSubscriptionUpgradeDocument,
    refetchInvoices
  );
  const { id, user, deactivation, canRevertUpgrade } = subscription;
  const close = () => setOpen(null);

  const deactivate = async (reason: SubscriptionDeactivationReason) => {
    const { data } = await client.query({
      query: SubscriptionCancellationMailDocument,
      variables: { id, reason },
      fetchPolicy: 'network-only',
    });
    const mail = data?.subscriptionCancellationMail;

    if (!mail) {
      throw new Error('Could not look up the mail of this action');
    }

    const decision = await askMail({ ...mail, recipient: mail.recipientEmail });

    if (decision === 'cancel') {
      return;
    }

    close();
    await cancelSubscription({
      variables: {
        reason,
        cancelSubscriptionId: id,
        skipMail: skipMailFor(decision),
      },
    });
    reload();
  };

  const reactivate = async () => {
    close();
    await reactivateSubscription({ variables: { id } });
    reload();
  };

  const revert = async () => {
    close();
    await revertSubscriptionUpgrade({ variables: { id } });
    reload();
  };

  return (
    <>
      {deactivation === null ?
        <Button
          variant="outlined"
          onClick={() => setOpen('deactivate')}
          startIcon={<MdUnpublished />}
        >
          {t('userSubscriptionEdit.deactivation.title.activated')}
        </Button>
      : null}

      {canRevertUpgrade ?
        <Button
          variant="outlined"
          data-testid="revertSubscriptionUpgrade"
          disabled={reverting}
          onClick={() => setOpen('revert')}
          startIcon={<MdUndo />}
        >
          {t('userSubscriptionEdit.revertUpgrade.title')}
        </Button>
      : null}

      {deactivation !== null && !canRevertUpgrade ?
        <Button
          variant="outlined"
          color="success"
          data-testid="reactivateSubscription"
          disabled={reactivating}
          onClick={() => setOpen('reactivate')}
          startIcon={<MdRestartAlt />}
        >
          {t('userSubscriptionEdit.reactivation.title')}
        </Button>
      : null}

      <Dialog
        fullWidth
        open={open === 'deactivate'}
        maxWidth="sm"
        onClose={close}
      >
        <UserSubscriptionDeactivatePanel
          displayName={user.name}
          userEmail=""
          paidUntil={
            subscription.paidUntil ?
              new Date(subscription.paidUntil)
            : undefined
          }
          onDeactivate={({ reason }) => reporting(() => deactivate(reason))}
          onClose={close}
        />
      </Dialog>

      <ReactivateSubscriptionModal
        open={open === 'reactivate'}
        loading={reactivating}
        userName={user.name}
        memberPlanName={subscription.memberPlan.name}
        monthlyAmount={subscription.monthlyAmount}
        paymentPeriodicity={subscription.paymentPeriodicity}
        currency={subscription.currency}
        paidUntil={
          subscription.paidUntil ? new Date(subscription.paidUntil) : null
        }
        deactivation={deactivation}
        onClose={close}
        onConfirm={() => reporting(reactivate)}
      />

      <Dialog
        fullWidth
        open={open === 'revert'}
        maxWidth="sm"
        onClose={close}
      >
        <DialogTitle>
          {t('userSubscriptionEdit.revertUpgrade.modalTitle')}
        </DialogTitle>
        <DialogContent>
          {t('userSubscriptionEdit.revertUpgrade.modalMessage')}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={close}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={reverting}
            onClick={() => reporting(revert)}
          >
            {t('userSubscriptionEdit.revertUpgrade.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
