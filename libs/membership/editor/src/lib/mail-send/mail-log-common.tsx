import { Typography } from '@mui/material';
import { MailLogState, MailLogType } from '@wepublish/editor/api';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { MdHelpOutline } from 'react-icons/md';
import { Popover, Tag, Whisper } from 'rsuite';

const STATE_COLORS: Record<MailLogState, 'green' | 'yellow' | 'red' | 'blue'> =
  {
    [MailLogState.Submitted]: 'blue',
    [MailLogState.Accepted]: 'blue',
    [MailLogState.Delivered]: 'green',
    [MailLogState.Deferred]: 'yellow',
    [MailLogState.Bounced]: 'red',
    [MailLogState.Rejected]: 'red',
  };

export function MailLogStateTag({ state }: { state: MailLogState }) {
  return <Tag color={STATE_COLORS[state] ?? 'blue'}>{state}</Tag>;
}

export function mailLogTypeLabel(
  type: MailLogType | null | undefined,
  t: TFunction
): string {
  if (!type) {
    return '—';
  }

  return t(`mailLog.types.${type}`);
}

/**
 * Maps the raw provider/transport error onto a diagnosis the reader can act on.
 * The stored message stays untouched — this only adds an explanation on top, so
 * new provider wordings degrade to the generic entry instead of breaking.
 */
const ERROR_HELP_RULES: ReadonlyArray<{ pattern: RegExp; key: string }> = [
  {
    pattern:
      /self[- ]signed certificate|unable to verify the first certificate|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|ERR_TLS_CERT_ALTNAME_INVALID|certificate has expired|UNABLE_TO_GET_ISSUER_CERT/i,
    key: 'tls',
  },
  { pattern: /ECONNREFUSED|connection refused/i, key: 'connectionRefused' },
  { pattern: /ENOTFOUND|EAI_AGAIN|getaddrinfo/i, key: 'hostNotFound' },
  {
    pattern: /ETIMEDOUT|ESOCKET|Greeting never received|timed? ?out/i,
    key: 'timeout',
  },
  {
    pattern:
      /\b(401|403|535)\b|invalid login|authentication failed|unauthorized|forbidden|invalid api key|missing api key/i,
    key: 'auth',
  },
  {
    pattern:
      /\b(550|553|554)\b|mailbox unavailable|not allowed to send|domain not found|recipient rejected|no such user/i,
    key: 'recipientRejected',
  },
  { pattern: /\b429\b|rate limit|too many requests/i, key: 'rateLimit' },
  { pattern: /mailprovider is not set/i, key: 'noProvider' },
  {
    pattern: /mailtemplate <.*> not found|mail template not found/i,
    key: 'templateMissing',
  },
];

export const mailErrorHelpKey = (error: string): string =>
  ERROR_HELP_RULES.find(rule => rule.pattern.test(error))?.key ?? 'generic';

/** The raw error plus a hover explanation of cause and remedy. */
export function MailErrorCell({ error }: { error?: string | null }) {
  const { t } = useTranslation();

  if (!error) {
    return <>—</>;
  }

  const key = mailErrorHelpKey(error);

  return (
    <Whisper
      trigger="hover"
      placement="leftStart"
      speaker={
        <Popover style={{ maxWidth: 420 }}>
          <Typography
            variant="subtitle2"
            display="block"
          >
            {t('mailLog.errorHelp.causeTitle')}
          </Typography>
          <Typography
            variant="body2"
            display="block"
            style={{ marginBottom: 8 }}
          >
            {t(`mailLog.errorHelp.${key}.cause`)}
          </Typography>

          <Typography
            variant="subtitle2"
            display="block"
          >
            {t('mailLog.errorHelp.fixTitle')}
          </Typography>
          <Typography
            variant="body2"
            display="block"
            style={{ marginBottom: 8, whiteSpace: 'pre-line' }}
          >
            {t(`mailLog.errorHelp.${key}.fix`)}
          </Typography>

          <Typography
            variant="caption"
            display="block"
            style={{ color: '#8e8e93' }}
          >
            {t('mailLog.errorHelp.raw')}
          </Typography>
          <code style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
            {error}
          </code>
        </Popover>
      }
    >
      <span
        style={{
          color: '#d9534f',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'help',
        }}
      >
        {error}
        <MdHelpOutline />
      </span>
    </Whisper>
  );
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '—';
  }

  // Swiss format (DD.MM.YYYY, 24h) regardless of the browser locale, so dates
  // never render US-style with AM/PM.
  return new Date(value).toLocaleString('de-CH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
