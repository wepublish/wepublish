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
import { MdUnsubscribe } from 'react-icons/md';
import { InfoTooltip, useAuthorisation } from '@wepublish/ui/editor';
import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
import { templatesForChannel } from '../mail-template/template-versions';
import {
  DEFAULT_DELIVERY_CHANNEL,
  useDeliveryChannels,
} from '../delivery-mode/channels';
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';
import { CanUpdateSubscriptionFlow } from '@wepublish/permissions';

// Every flow keeps these events; the API refuses to delete them.
const REQUIRED_EVENTS: SubscriptionEvent[] = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
];

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
  // The email always goes out, to everyone not on another channel, so only a
  // template with an email version can be sent from a flow. The chosen one
  // stays listed whatever it has, or the select would show nothing.
  const offered = mailTemplates.filter(
    template =>
      template.id === selectedId ||
      templatesForChannel([template], DEFAULT_DELIVERY_CHANNEL).length > 0
  );

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

  // «No mail»: a required event stays and only loses its template (and
  // with it the letter), any other event is removed.
  const removeTemplate = () => {
    if (!subscriptionInterval) {
      return;
    }

    if (REQUIRED_EVENTS.includes(subscriptionInterval.object.event)) {
      return client.updateSubscriptionInterval({
        variables: { id: subscriptionInterval.object.id, mailTemplateId: null },
      });
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
      <TextField
        select
        disabled={!canUpdateSubscriptionFlow}
        value={subscriptionInterval?.object.mailTemplate?.id ?? ''}
        onChange={event => {
          if (event.target.value) {
            createOrUpdateInterval(event.target.value);
          } else {
            removeTemplate();
          }
        }}
        slotProps={{
          select: {
            displayEmpty: true,
            SelectDisplayProps: { 'aria-label': label } as object,
          },
        }}
        fullWidth
      >
        <MenuItem value="">
          <MdUnsubscribe
            size={16}
            style={{ marginRight: '5px' }}
          />
          {t('mailTemplateSelect.noMailSentSelectNow')}
        </MenuItem>

        {offered.map(mailTemplate => (
          <MenuItem
            key={mailTemplate.id}
            value={mailTemplate.id}
          >
            {formatTemplateLabel(
              mailTemplate.name,
              mailTemplate.context,
              (k, f) => t(k, f)
            )}
          </MenuItem>
        ))}
      </TextField>
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
