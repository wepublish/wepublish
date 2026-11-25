import { Alert, AlertColor, Checkbox, FormControlLabel } from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';

import { CustomField } from './genericIntegrationForm';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type ContactSyncSetting = {
  bexio_contactSyncAt?: string | null;
  bexio_contactSyncError?: string | null;
};

/**
 * Got nowhere: bexio refused the key, or every reader. Some readers refused
 * is a warning; the rest went through.
 */
const syncFailedOut = (error: string) =>
  error.startsWith('bexio rejects the API key') ||
  /^(\d+) of \1 readers failed/.test(error);

/** When the nightly contact sync last ran and whether it went through. */
function contactSyncStatus(
  setting: ContactSyncSetting,
  t: Translate
): { severity: AlertColor; text: string } {
  if (!setting.bexio_contactSyncAt) {
    return {
      severity: 'info',
      text: t('integrations.paymentSettings.bexioContactSyncNeverRan'),
    };
  }

  const date = new Date(setting.bexio_contactSyncAt).toLocaleString();
  const error = setting.bexio_contactSyncError;

  if (!error) {
    return {
      severity: 'success',
      text: t('integrations.paymentSettings.bexioContactSyncLastRun', { date }),
    };
  }

  return {
    severity: syncFailedOut(error) ? 'error' : 'warning',
    text: t('integrations.paymentSettings.bexioContactSyncLastRunFailed', {
      date,
      error,
    }),
  };
}

/**
 * The switch for the nightly contact sync, with how its last run went in
 * plain view: a partial failure must not hide in a tooltip.
 */
export const bexioContactSyncField = (
  setting: ContactSyncSetting,
  t: Translate
): CustomField<boolean> & { name: 'bexio_contactSync'; label: string } => {
  const label = t('integrations.paymentSettings.bexioContactSync');
  const { severity, text } = contactSyncStatus(setting, t);

  return {
    name: 'bexio_contactSync',
    label,
    type: 'custom',
    render: ({ value, onChange, disabled }) => (
      <>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={(_event, checked) => onChange(checked)}
              disabled={disabled}
            />
          }
          label={
            <>
              {label}{' '}
              <InfoTooltip
                text={t('integrations.paymentSettings.bexioContactSyncInfo')}
              />
            </>
          }
        />
        {value && (
          <Alert
            role="status"
            severity={severity}
            sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
          >
            {text}
          </Alert>
        )}
      </>
    ),
  };
};
