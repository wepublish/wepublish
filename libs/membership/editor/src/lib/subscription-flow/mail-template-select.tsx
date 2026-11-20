import { useContext } from 'react';
import {
  MailChannel,
  TinyMailTemplateFragment,
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { SubscriptionClientContext } from './graphql-client-context';
import {
  DecoratedSubscriptionInterval,
  isNonUserEvent,
  NonUserActionInterval,
  UserActionInterval,
} from './subscription-flow-list';
import { useTranslation } from 'react-i18next';
import { InfoTooltip, useAuthorisation } from '@wepublish/ui/editor';
import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { purposeOfEvent } from '../mail-template/event-purpose';
import { MailTemplateField } from '../mail-template/mail-template-field';
import { useDeliveryChannels } from '../delivery-mode/channels';
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';
import { CanUpdateSubscriptionFlow } from '@wepublish/permissions';

interface MailTemplateSelectProps {
  mailTemplates: TinyMailTemplateFragment[];
  subscriptionInterval?: DecoratedSubscriptionInterval<
    NonUserActionInterval | UserActionInterval
  >;
  newDaysAwayFromEnding?: number;
  subscriptionFlow: SubscriptionFlowFragment;
  event: SubscriptionEvent;
  label?: string;
}

export function MailTemplateSelect({
  mailTemplates,
  subscriptionInterval,
  newDaysAwayFromEnding,
  subscriptionFlow,
  event,
  label,
}: MailTemplateSelectProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    CanUpdateSubscriptionFlow.id
  );

  const client = useContext(SubscriptionClientContext);
  const paperLetterFlow = usePaperLetterFlow();
  const channels = useDeliveryChannels();

  const selectedId = subscriptionInterval?.object.mailTemplate?.id;
  const selected = mailTemplates.find(({ id }) => id === selectedId);
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

  // Only the channel is sent: days and template stay as they are.
  const setSendAsLetter = (sendAsLetter: boolean) =>
    subscriptionInterval &&
    client.updateSubscriptionInterval({
      variables: { id: subscriptionInterval.object.id, sendAsLetter },
    });

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center' }}
    >
      <MailTemplateField
        value={selectedId}
        templates={mailTemplates}
        purpose={purposeOfEvent(event)}
        label={label ?? ''}
        disabled={!canUpdateSubscriptionFlow}
        onChange={mailTemplateId => {
          if (mailTemplateId) {
            createOrUpdateInterval(mailTemplateId);
          } else {
            deleteInterval();
          }
        }}
      />
      {/* Only for an event that sends something: without a template there
          is no message to choose channels for. */}
      {paperLetterFlow && subscriptionInterval && selectedId && (
        <Stack
          role="group"
          aria-label={t('mailTemplateSelect.channels')}
          direction="row"
          sx={{ alignItems: 'center', whiteSpace: 'nowrap' }}
        >
          {channels.map(({ channel, labelKey, isDefault }) => {
            // A channel needs its own version of the template. Without one
            // the box is off, whatever the interval still says: the api
            // sends the email then.
            const hasVersion = !!selected?.channels.includes(channel);

            return (
              <FormControlLabel
                key={channel}
                control={
                  <Checkbox
                    size="small"
                    // The default channel is what everyone else gets: shown,
                    // never switched off.
                    checked={
                      isDefault ||
                      (hasVersion &&
                        channel === MailChannel.Letter &&
                        subscriptionInterval.object.sendAsLetter)
                    }
                    disabled={
                      isDefault || !hasVersion || !canUpdateSubscriptionFlow
                    }
                    onChange={(_event, checked) => setSendAsLetter(checked)}
                  />
                }
                label={t(labelKey)}
                // The label's own negative margin would eat the row's gap
                // now that it no longer sits directly in the row.
                sx={{ marginLeft: 0, marginRight: 0.5 }}
              />
            );
          })}
          <InfoTooltip
            text={
              selected?.channels.includes(MailChannel.Letter) ?
                t('mailTemplateSelect.sendAsLetterHint')
              : t('mailTemplateSelect.noLetterVersion')
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
