import { SubscriptionFlowFragment } from '@wepublish/editor/api';
import { PermissionControl, ClickPopover } from '@wepublish/ui/editor';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from 'react-icons/md';
import { SubscriptionClientContext } from './graphql-client-context';
import { IconButton, Button } from '@mui/material';

interface DeleteSubscriptionFlowProps {
  subscriptionFlow: SubscriptionFlowFragment;
}

export function DeleteSubscriptionFlow({
  subscriptionFlow,
}: DeleteSubscriptionFlowProps) {
  const { t } = useTranslation();
  const client = useContext(SubscriptionClientContext);

  return (
    <PermissionControl qualifyingPermissions={['CAN_DELETE_SUBSCRIPTION_FLOW']}>
      <ClickPopover
        trigger={
          <IconButton
            size="small"
            color="error"
            disabled={subscriptionFlow.default}
          >
            <MdDelete />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <p>{t('subscriptionFlow.deleteFlowQuestion')}</p>

        <Button
          variant="contained"
          startIcon={<MdDelete />}
          style={{ marginTop: '5px' }}
          color="error"
          size="small"
          onClick={() =>
            client.deleteSubscriptionFlow({
              variables: { id: subscriptionFlow.id },
            })
          }
        >
          {t('subscriptionFlow.deletePermanently')}
        </Button>
      </ClickPopover>
    </PermissionControl>
  );
}
