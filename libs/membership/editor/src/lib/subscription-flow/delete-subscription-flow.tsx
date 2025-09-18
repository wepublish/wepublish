import { SubscriptionFlowFragment } from '@wepublish/editor/api-v2';
import { PermissionControl } from '@wepublish/ui/editor';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDelete } from 'react-icons/md';
import { IconButton, Popover, Whisper } from 'rsuite';
import { SubscriptionClientContext } from './graphql-client-context';

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
      <Whisper
        placement="leftEnd"
        trigger="click"
        speaker={
          <Popover>
            <p>{t('subscriptionFlow.deleteFlowQuestion')}</p>

            <IconButton
              style={{ marginTop: '5px' }}
              color="red"
              size="sm"
              appearance="primary"
              icon={<MdDelete />}
              onClick={() =>
                client.deleteSubscriptionFlow({
                  variables: { id: subscriptionFlow.id },
                })
              }
            >
              {t('subscriptionFlow.deletePermanently')}
            </IconButton>
          </Popover>
        }
      >
        <IconButton
          size="sm"
          color="red"
          circle
          appearance="primary"
          icon={<MdDelete />}
          disabled={subscriptionFlow.default}
        />
      </Whisper>
    </PermissionControl>
  );
}
