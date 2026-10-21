import {
  CreateMailProviderSettingDocument,
  MailProviderSettingsDocument,
  MailProviderType,
  SettingMailProvider,
  UpdateMailProviderSettingDocument,
} from '@wepublish/editor/api';
import { Box, Typography } from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import mailChimpLogo from './assets/mailchimp.webp';
import mailgunLogo from './assets/mailgun.svg';
import slackLogo from './assets/slack.webp';
import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const mailSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(MailProviderType).nullish(),

  fromAddress: z.string().nullish().or(z.literal('')),
  replyToAddress: z.string().nullish().or(z.literal('')),

  apiKey: z.string().nullish().or(z.literal('')),
  webhookEndpointSecret: z.string().nullish().or(z.literal('')),

  mailchimp_baseURL: z.string().nullish().or(z.literal('')),

  mailgun_baseDomain: z.string().nullish().or(z.literal('')),
  mailgun_mailDomain: z.string().nullish().or(z.literal('')),

  slack_webhookURL: z.string().nullish().or(z.literal('')),

  smtp_host: z.string().nullish().or(z.literal('')),
  smtp_port: z.number().nullish(),
  smtp_secure: z.boolean().nullish(),
  smtp_user: z.string().nullish().or(z.literal('')),
});

type IntegrationFormValues = z.infer<typeof mailSettingsSchema>;

/** Providers that report delivery outcomes, by webhook or on request. */
const REPORTING_TYPES = new Set([
  MailProviderType.Mailchimp,
  MailProviderType.Mailgun,
]);

/**
 * When the provider last reached us and when we last asked it. Both empty
 * means the users' email status rests on logins alone, which is what an
 * admin wondering about the delivery channel suggestions needs to know.
 */
function MailEvidenceStatus({ setting }: { setting: SettingMailProvider }) {
  const { t, i18n } = useTranslation();
  const format = (value?: string | null) =>
    value ?
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : t('integrations.mailSettings.evidence.never');

  if (!setting.type || !REPORTING_TYPES.has(setting.type)) {
    return (
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', marginBottom: 2 }}
      >
        {t('integrations.mailSettings.evidence.notReporting')}
      </Typography>
    );
  }

  return (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="subtitle2">
        {t('integrations.mailSettings.evidence.title')}{' '}
        <InfoTooltip text={t('integrations.mailSettings.evidence.info')} />
      </Typography>
      <Typography variant="body2">
        {t('integrations.mailSettings.evidence.lastWebhookAt')}:{' '}
        {format(setting.lastWebhookAt)}
      </Typography>
      <Typography variant="body2">
        {t('integrations.mailSettings.evidence.lastPollAt')}:{' '}
        {format(setting.lastPollAt)}
      </Typography>
      {setting.lastPollError && (
        <Typography
          variant="body2"
          sx={{ color: 'error.main' }}
        >
          {t('integrations.mailSettings.evidence.lastPollError')}:{' '}
          {setting.lastPollError}
        </Typography>
      )}
    </Box>
  );
}

export function MailIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingMailProvider, IntegrationFormValues>
      query={MailProviderSettingsDocument}
      mutation={UpdateMailProviderSettingDocument}
      dataKey="mailProviderSettings"
      setup={{
        createMutation: CreateMailProviderSettingDocument,
        types: Object.values(MailProviderType).map(type => ({
          label: type,
          value: type,
        })),
      }}
      schema={mailSettingsSchema}
      renderStatus={setting => <MailEvidenceStatus setting={setting} />}
      getLogo={setting => {
        switch (setting.type) {
          case MailProviderType.Mailchimp:
            return mailChimpLogo;
          case MailProviderType.Mailgun:
            return mailgunLogo;
          case MailProviderType.Slack:
            return slackLogo;
          default:
            return undefined;
        }
      }}
      fields={setting => {
        const commonFields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'type',
            label: t('integrations.mailSettings.type'),
            info: t('integrations.mailSettings.typeInfo'),
            type: 'select',
            options: Object.values(MailProviderType).map(v => ({
              label: v,
              value: v,
            })),
          },
          {
            type: 'text',
            name: 'name',
            label: t('name'),
          },
          {
            type: 'text',
            name: 'fromAddress',
            label: t('integrations.mailSettings.fromAddress'),
            info: t('integrations.mailSettings.fromAddressInfo'),
          },
          {
            type: 'text',
            name: 'replyToAddress',
            label: t('integrations.mailSettings.replyToAddress'),
            info: t('integrations.mailSettings.replyToAddressInfo'),
          },
        ];

        if (setting.type === MailProviderType.Mailchimp) {
          commonFields.push({
            name: 'apiKey',
            label: t('integrations.mailSettings.apiKey'),
            info: t('integrations.mailSettings.apiKeyInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            name: 'webhookEndpointSecret',
            label: t('integrations.mailSettings.webhookEndpointSecret'),
            info: t('integrations.mailSettings.webhookEndpointSecretInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            type: 'text',
            name: 'mailchimp_baseURL',
            label: t('integrations.mailSettings.mailchimpBaseUrl'),
          });
        }

        if (setting.type === MailProviderType.Mailgun) {
          commonFields.push({
            name: 'apiKey',
            label: t('integrations.mailSettings.apiKey'),
            info: t('integrations.mailSettings.apiKeyInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            name: 'webhookEndpointSecret',
            label: t('integrations.mailSettings.webhookEndpointSecret'),
            info: t('integrations.mailSettings.webhookEndpointSecretInfo'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
          commonFields.push({
            type: 'text',
            name: 'mailgun_baseDomain',
            label: t('integrations.mailSettings.mailgunBaseDomain'),
            info: t('integrations.mailSettings.mailgunBaseDomainInfo'),
          });
          commonFields.push({
            type: 'text',
            name: 'mailgun_mailDomain',
            label: t('integrations.mailSettings.mailgunMailDomain'),
            info: t('integrations.mailSettings.mailgunMailDomainInfo'),
          });
        }

        if (setting.type === MailProviderType.Slack) {
          commonFields.push({
            type: 'text',
            name: 'slack_webhookURL',
            label: t('integrations.mailSettings.slackWebhookUrl'),
            info: t('integrations.mailSettings.slackWebhookUrlInfo'),
          });
        }

        if (setting.type === MailProviderType.Smtp) {
          commonFields.push({
            type: 'text',
            name: 'smtp_host',
            label: t('integrations.mailSettings.smtpHost'),
            info: t('integrations.mailSettings.smtpHostInfo'),
          });
          commonFields.push({
            type: 'number',
            name: 'smtp_port',
            label: t('integrations.mailSettings.smtpPort'),
            info: t('integrations.mailSettings.smtpPortInfo'),
          });
          commonFields.push({
            type: 'checkbox',
            name: 'smtp_secure',
            label: t('integrations.mailSettings.smtpSecure'),
            info: t('integrations.mailSettings.smtpSecureInfo'),
          });
          commonFields.push({
            type: 'text',
            name: 'smtp_user',
            label: t('integrations.mailSettings.smtpUser'),
          });
          commonFields.push({
            name: 'apiKey',
            label: t('integrations.mailSettings.smtpPassword'),
            type: 'password',
            autoComplete: 'one-time-code',
          });
        }

        return commonFields;
      }}
    />
  );
}
