import { useQuery } from '@apollo/client/react';
import { Alert, Stack, SxProps, Theme } from '@mui/material';
import { EmailEvidenceDocument, EmailEvidenceQuery } from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';

type Evidence = EmailEvidenceQuery['emailEvidence'];

export type EvidenceWarning = {
  key: 'pollError' | 'noProviderReports' | 'never' | 'stale';
  params: Record<string, string | number>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * What to tell an admin about where the email status comes from. Nothing
 * while provider evidence arrived within the threshold, whatever the
 * provider: an SMTP installation still gets newsletter evidence through
 * the Mailchimp sync.
 */
export const evidenceWarnings = (
  evidence: Evidence,
  now: Date,
  formatDate: (date: Date) => string
): EvidenceWarning[] => {
  const warnings: EvidenceWarning[] = [];

  if (evidence.lastPollError) {
    warnings.push({ key: 'pollError', params: { error: evidence.lastPollError } });
  }

  const lastAt =
    evidence.lastProviderEvidenceAt ?
      new Date(evidence.lastProviderEvidenceAt)
    : null;
  const days =
    lastAt ? Math.floor((now.getTime() - lastAt.getTime()) / DAY_MS) : null;

  if (days !== null && days < evidence.warnAfterDays) {
    return warnings;
  }

  if (!evidence.providerReportsDelivery) {
    warnings.push({
      key: 'noProviderReports',
      params: { provider: evidence.providerName || evidence.providerType || '' },
    });
  } else if (!lastAt) {
    warnings.push({ key: 'never', params: {} });
  } else {
    warnings.push({
      key: 'stale',
      params: { days: days as number, lastAt: formatDate(lastAt) },
    });
  }

  return warnings;
};

/**
 * Warns when the email status rests on logins alone: the provider never
 * reported anything, has fallen silent, or cannot report at all (SMTP).
 */
export function EmailEvidenceNotice({ sx }: { sx?: SxProps<Theme> }) {
  const { t, i18n } = useTranslation();
  const { data } = useQuery(EmailEvidenceDocument, {
    fetchPolicy: 'cache-and-network',
  });

  if (!data?.emailEvidence) {
    return null;
  }

  const warnings = evidenceWarnings(data.emailEvidence, new Date(), date =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(date)
  );

  if (!warnings.length) {
    return null;
  }

  return (
    <Stack
      spacing={1}
      sx={sx}
    >
      {warnings.map(({ key, params }) => (
        <Alert
          key={key}
          severity="warning"
        >
          {t(`mailSend.emailEvidence.${key}`, params)}
        </Alert>
      ))}
    </Stack>
  );
}
