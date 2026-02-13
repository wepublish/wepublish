import { useContext, useMemo } from 'react';
import {
  FullMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { SelectPicker } from 'rsuite';
import { SubscriptionClientContext } from './graphql-client-context';
import {
  DecoratedSubscriptionInterval,
  isNonUserEvent,
  NonUserActionInterval,
  UserActionInterval,
} from './subscription-flow-list';
import { useTranslation } from 'react-i18next';
import { MdUnsubscribe } from 'react-icons/md';
import { useAuthorisation } from '@wepublish/ui/editor';

interface MailTemplateSelectProps {
  mailTemplates: FullMailTemplateFragment[];
  subscriptionInterval?: DecoratedSubscriptionInterval<
    NonUserActionInterval | UserActionInterval
  >;
  newDaysAwayFromEnding?: number;
  subscriptionFlow: SubscriptionFlowFragment;
  event: SubscriptionEvent;
}

export function MailTemplateSelect({
  mailTemplates,
  subscriptionInterval,
  newDaysAwayFromEnding,
  subscriptionFlow,
  event,
}: MailTemplateSelectProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );
  const inactiveMailTemplates = useMemo(
    () => mailTemplates.filter(mailTemplate => mailTemplate.remoteMissing),
    [mailTemplates]
  );

  const client = useContext(SubscriptionClientContext);

  const createOrUpdateInterval = (value: string) => {
    if (subscriptionInterval) {
      return client.updateSubscriptionInterval({
        variables: {
          id: subscriptionInterval.object.id,
          daysAwayFromEnding: subscriptionInterval.object.daysAwayFromEnding,
          mailTemplateId: value,
        },
      });
    }

    // No MailTemplate selected previously, must create one
    return client.createSubscriptionInterval({
      variables: {
        daysAwayFromEnding:
          isNonUserEvent(event) ? newDaysAwayFromEnding || 0 : null,
        mailTemplateId: value,
        subscriptionFlowId: subscriptionFlow.id,
        event,
      },
    });
  };

  const deleteInterval = () => {
    if (!subscriptionInterval) {
      return;
    }

    return client.deleteSubscriptionInterval({
      variables: {
        id: subscriptionInterval.object.id,
      },
    });
  };

  return (
    <SelectPicker
      style={{ width: '100%' }}
      data={mailTemplates.map(mailTemplate => ({
        label: `${mailTemplate.remoteMissing ? '⚠' : ''} ${mailTemplate.name}`,
        value: mailTemplate.id,
      }))}
      disabled={!canUpdateSubscriptionFlow}
      disabledItemValues={inactiveMailTemplates.map(
        mailTemplate => mailTemplate.id
      )}
      defaultValue={subscriptionInterval?.object.mailTemplate?.id}
      onSelect={createOrUpdateInterval}
      onClean={deleteInterval}
      placeholder={
        <>
          <MdUnsubscribe
            size={16}
            style={{ marginRight: '5px' }}
          />
          {t('mailTemplateSelect.noMailSentSelectNow')}
        </>
      }
    />
  );
}
