import { MailChannel, MailEmailSegment } from '@wepublish/editor/api';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { deliveryChannel } from '../../delivery-mode/channels';

/**
 * How many messages the current audience resolves to, plus the warnings about
 * placeholders this audience cannot fill and recipients a letter cannot reach.
 * Shown while choosing the audience and again before sending; only the send step
 * passes an `action`.
 */
export function RecipientSummary({
  loading,
  headline,
  count,
  userCount,
  channel,
  withoutAddressCount,
  segmentCounts,
  missing,
  onShowRecipients,
  showRecipientsLabel,
  action,
}: {
  loading: boolean;
  /** Replaces the message count, where messages are not the point. */
  headline?: ReactNode;
  count: number;
  userCount: number;
  channel: MailChannel;
  withoutAddressCount: number;
  /**
   * People per email status, shown for reading only: they are picked in the
   * audience filter. Passed where the filter is out of sight, before sending.
   */
  segmentCounts?: { segment: MailEmailSegment; userCount: number }[];
  missing: string[];
  /** Absent when the viewer may not see the list. */
  onShowRecipients?: () => void;
  /** The people are recipients only in the send tool; others name them. */
  showRecipientsLabel?: ReactNode;
  action?: ReactElement;
}) {
  const { t } = useTranslation();
  const { countKey, needsPostalAddress } = deliveryChannel(channel);

  return (
    <Card
      variant="outlined"
      style={{ marginTop: 16 }}
    >
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center' }}
            spacing={1.5}
          >
            <span role="status">
              {loading ?
                t('mailSend.counting')
              : (headline ?? t(countKey, { count, people: userCount }))}
            </span>
            {onShowRecipients && (
              <Button
                variant="text"
                size="small"
                disabled={count === 0}
                onClick={onShowRecipients}
              >
                {showRecipientsLabel ?? t('mailSend.showRecipients')}
              </Button>
            )}
          </Stack>

          {action}
        </Stack>

        {!!segmentCounts?.length && (
          <Typography
            component="div"
            variant="caption"
            sx={{ color: 'text.secondary' }}
            style={{ marginTop: 12 }}
          >
            <div>{t('mailSend.emailSegments.overview')}</div>
            <Stack
              component="ul"
              direction="row"
              spacing={2}
              useFlexGap
              sx={{
                flexWrap: 'wrap',
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {segmentCounts.map(({ segment, userCount: people }) => (
                <li key={segment}>
                  {t(`mailSend.emailSegments.${segment}`)}: {people}
                </li>
              ))}
            </Stack>
          </Typography>
        )}

        {needsPostalAddress && withoutAddressCount > 0 && (
          <Alert
            severity="warning"
            style={{ marginTop: 12 }}
          >
            {t('mailSend.channel.withoutAddress', {
              count: withoutAddressCount,
            })}
          </Alert>
        )}

        <MissingPlaceholdersWarning missing={missing} />
      </CardContent>
    </Card>
  );
}

/** Placeholders the template uses that the chosen audience cannot fill. */
export function MissingPlaceholdersWarning({ missing }: { missing: string[] }) {
  const { t } = useTranslation();

  if (!missing.length) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      style={{ marginTop: 12 }}
    >
      {t('mailSend.missingPlaceholders', {
        placeholders: missing.join(', '),
      })}
    </Alert>
  );
}
