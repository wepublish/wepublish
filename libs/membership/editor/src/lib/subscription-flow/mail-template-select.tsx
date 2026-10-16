import { useContext } from 'react';
import {
  TinyMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { SelectPicker, Toggle } from 'rsuite';
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
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';

interface MailTemplateSelectProps {
  mailTemplates: TinyMailTemplateFragment[];
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

  const client = useContext(SubscriptionClientContext);
  const paperLetterFlow = usePaperLetterFlow();

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

  // Only the switch is sent: days and template stay as they are.
  const setSendAsLetter = (sendAsLetter: boolean) =>
    subscriptionInterval &&
    client.updateSubscriptionInterval({
      variables: { id: subscriptionInterval.object.id, sendAsLetter },
    });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SelectPicker
        block
        style={{ flex: 1 }}
        data={mailTemplates.map(mailTemplate => ({
          label: formatTemplateLabel(
            mailTemplate.name,
            mailTemplate.context,
            (k, f) => t(k, f)
          ),
          value: mailTemplate.id,
        }))}
        disabled={!canUpdateSubscriptionFlow}
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
      {paperLetterFlow && subscriptionInterval && (
        <Toggle
          size="sm"
          aria-label={t('mailTemplateSelect.sendAsLetter')}
          title={t('mailTemplateSelect.sendAsLetterHint')}
          checked={subscriptionInterval.object.sendAsLetter}
          disabled={!canUpdateSubscriptionFlow}
          onChange={setSendAsLetter}
        >
          {t('mailTemplateSelect.sendAsLetter')}
        </Toggle>
      )}
    </div>
  );
}
