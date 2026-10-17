import { useQuery } from '@apollo/client/react';
import {
  DeliveryModeAudiencePreviewDocument,
  MailChannel,
} from '@wepublish/editor/api';
import { useAuthorisation } from '@wepublish/ui/editor';
import { Card, CardContent, CardHeader } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AudienceFilter } from '../mail-send/audience/audience-filter';
import { useAudienceState } from '../mail-send/audience/audience-state';
import { RecipientListModal } from '../mail-send/audience/recipient-list-modal';
import { RecipientSummary } from '../mail-send/audience/recipient-summary';
import { DeliveryModeAudienceAction } from './delivery-mode-audience-action';
import { DeliveryModeBulkChanges } from './delivery-mode-bulk-changes';
import { usePaperLetterFlow } from './use-paper-letter-flow';

/**
 * The manual counterpart of the suggestions: narrow an audience exactly as
 * for a manual send, see who is in it, and switch everyone's delivery mode.
 * The count is per person (the letter channel collapses subscriptions), so
 * it says what a switch would touch whichever way it goes.
 */
export function DeliveryModeAudienceSection() {
  const { t } = useTranslation();
  const flow = usePaperLetterFlow();
  const allowed = useAuthorisation('CAN_MANAGE_USER-DELIVERY-MODE');
  const canListRecipients = useAuthorisation('CAN_SEND_MAIL-TEMPLATES');
  const enabled = flow && allowed;

  const { state, update, audience } = useAudienceState();
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, loading, refetch } = useQuery(
    DeliveryModeAudiencePreviewDocument,
    {
      variables: { audience, channel: MailChannel.Letter },
      skip: !enabled,
    }
  );

  if (!enabled) {
    return null;
  }

  const preview = data?.deliveryModeAudiencePreview;
  const userCount = preview?.userCount ?? 0;

  return (
    <Card
      variant="outlined"
      sx={{ marginTop: 4 }}
    >
      <CardHeader
        title={t('deliveryMode.bulk.title')}
        subheader={t('deliveryMode.bulk.intro')}
      />
      <CardContent>
        <AudienceFilter
          state={state}
          onChange={update}
        />

        <RecipientSummary
          loading={loading && !preview}
          headline={t('deliveryMode.bulk.people', { count: userCount })}
          count={userCount}
          userCount={userCount}
          isLetter
          withoutAddressCount={preview?.withoutAddressCount ?? 0}
          segmentCounts={preview?.segments ?? []}
          selectedSegments={state.emailSegments}
          onPickSegment={segment =>
            update({
              emailSegments:
                state.emailSegments.includes(segment) ?
                  state.emailSegments.filter(item => item !== segment)
                : [...state.emailSegments, segment],
            })
          }
          onRefreshed={() => refetch()}
          missing={[]}
          onShowRecipients={
            canListRecipients ? () => setRecipientsOpen(true) : undefined
          }
          action={
            <DeliveryModeAudienceAction
              audience={audience}
              onDone={() => {
                refetch();
                setRefreshKey(key => key + 1);
              }}
            />
          }
        />

        {canListRecipients && (
          <RecipientListModal
            open={recipientsOpen}
            onClose={() => setRecipientsOpen(false)}
            audience={audience}
            channel={MailChannel.Letter}
            totalCount={userCount}
          />
        )}

        <DeliveryModeBulkChanges refreshKey={refreshKey} />
      </CardContent>
    </Card>
  );
}
