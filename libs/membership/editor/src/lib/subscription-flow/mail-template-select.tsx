import { useContext } from 'react';
import {
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
import { useAuthorisation } from '@wepublish/ui/editor';
import {
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { formatTemplateLabel } from '../mail-template/mail-placeholders';
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
    CanUpdateSubscriptionFlow.id
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
            deleteInterval();
          }
        }}
        slotProps={{ select: { displayEmpty: true } }}
        fullWidth
      >
        <MenuItem value="">
          <MdUnsubscribe
            size={16}
            style={{ marginRight: '5px' }}
          />
          {t('mailTemplateSelect.noMailSentSelectNow')}
        </MenuItem>

        {mailTemplates.map(mailTemplate => (
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
      {paperLetterFlow && subscriptionInterval && (
        <FormControlLabel
          title={t('mailTemplateSelect.sendAsLetterHint')}
          control={
            <Switch
              size="small"
              checked={subscriptionInterval.object.sendAsLetter}
              disabled={!canUpdateSubscriptionFlow}
              onChange={(_event, checked) => setSendAsLetter(checked)}
            />
          }
          label={t('mailTemplateSelect.sendAsLetter')}
          sx={{ whiteSpace: 'nowrap' }}
        />
      )}
    </Stack>
  );
}
