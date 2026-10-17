import { MailEmailSegment } from '@wepublish/editor/api';
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
import { EmailQualityRefreshButton } from '../email-quality-refresh-button';

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
  isLetter,
  withoutAddressCount,
  segmentCounts,
  selectedSegments,
  onPickSegment,
  onRefreshed,
  missing,
  onShowRecipients,
  action,
}: {
  loading: boolean;
  /** Replaces the message count, where messages are not the point. */
  headline?: ReactNode;
  count: number;
  userCount: number;
  isLetter: boolean;
  withoutAddressCount: number;
  segmentCounts: { segment: MailEmailSegment; userCount: number }[];
  selectedSegments: MailEmailSegment[];
  onPickSegment: (segment: MailEmailSegment) => void;
  onRefreshed: () => void;
  missing: string[];
  /** Absent when the viewer may not see the list. */
  onShowRecipients?: () => void;
  action?: ReactElement;
}) {
  const { t } = useTranslation();

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
            <span>
              {loading ?
                t('mailSend.counting')
              : (headline ??
                t(
                  isLetter ?
                    'mailSend.lettersCount'
                  : 'mailSend.recipientsCountPerPerson',
                  { count, people: userCount }
                ))
              }
            </span>
            {onShowRecipients && (
              <Button
                variant="text"
                size="small"
                disabled={count === 0}
                onClick={onShowRecipients}
              >
                {t('mailSend.showRecipients')}
              </Button>
            )}
          </Stack>

          {action}
        </Stack>

        {/* The split of the audience by email status: the analog people are
            placeholder + dead, and a tile toggles its segment in the filter. */}
        {segmentCounts.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            style={{ marginTop: 12 }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              {t('mailSend.emailSegments.overview')}
            </Typography>
            {segmentCounts.map(({ segment, userCount: people }) => (
              <Button
                key={segment}
                size="small"
                variant={
                  selectedSegments.includes(segment) ? 'contained' : 'outlined'
                }
                onClick={() => onPickSegment(segment)}
              >
                {t(`mailSend.emailSegments.${segment}`)}: {people}
              </Button>
            ))}
            <EmailQualityRefreshButton onDone={onRefreshed} />
          </Stack>
        )}

        {isLetter && withoutAddressCount > 0 && (
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
