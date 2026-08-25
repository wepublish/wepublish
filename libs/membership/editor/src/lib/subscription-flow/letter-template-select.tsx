import {
  SubscriptionEvent,
  SubscriptionFlowFragment,
  TinyLetterTemplateFragment,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MdMarkunreadMailbox } from 'react-icons/md';
import { SelectPicker } from 'rsuite';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
import { SubscriptionClientContext } from './graphql-client-context';
import {
  DecoratedSubscriptionInterval,
  isNonUserEvent,
  NonUserActionInterval,
  UserActionInterval,
} from './subscription-flow-list';

interface LetterTemplateSelectProps {
  letterTemplates: TinyLetterTemplateFragment[];
  subscriptionInterval?: DecoratedSubscriptionInterval<
    NonUserActionInterval | UserActionInterval
  >;
  newDaysAwayFromEnding?: number;
  subscriptionFlow: SubscriptionFlowFragment;
  event: SubscriptionEvent;
}

export function LetterTemplateSelect({
  letterTemplates,
  subscriptionInterval,
  newDaysAwayFromEnding,
  subscriptionFlow,
  event,
}: LetterTemplateSelectProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );

  const client = useContext(SubscriptionClientContext);

  const createOrUpdateInterval = (value: string) => {
    if (subscriptionInterval) {
      return client.updateSubscriptionInterval({
        variables: {
          id: subscriptionInterval.object.id,
          daysAwayFromEnding: subscriptionInterval.object.daysAwayFromEnding,
          letterTemplateId: value,
        },
      });
    }

    return client.createSubscriptionInterval({
      variables: {
        daysAwayFromEnding:
          isNonUserEvent(event) ? newDaysAwayFromEnding || 0 : null,
        letterTemplateId: value,
        subscriptionFlowId: subscriptionFlow.id,
        event,
      },
    });
  };

  /**
   * Clearing the letter only removes the interval when nothing else is sent at
   * this point — otherwise the mail keeps it alive.
   */
  const clearLetter = () => {
    if (!subscriptionInterval) {
      return;
    }

    if (subscriptionInterval.object.mailTemplate) {
      return client.updateSubscriptionInterval({
        variables: {
          id: subscriptionInterval.object.id,
          daysAwayFromEnding: subscriptionInterval.object.daysAwayFromEnding,
          letterTemplateId: null,
        },
      });
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
      size="sm"
      data={letterTemplates.map(letterTemplate => ({
        label: formatTemplateLabel(
          letterTemplate.name,
          letterTemplate.context,
          (k, f) => t(k, f)
        ),
        value: letterTemplate.id,
      }))}
      disabled={!canUpdateSubscriptionFlow}
      defaultValue={subscriptionInterval?.object.letterTemplate?.id}
      onSelect={createOrUpdateInterval}
      onClean={clearLetter}
      placeholder={
        <>
          <MdMarkunreadMailbox
            size={16}
            style={{ marginRight: '5px' }}
          />
          {t('letterTemplateSelect.noLetterSentSelectNow')}
        </>
      }
    />
  );
}
