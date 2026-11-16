import {
  CreateMailProviderSettingDocument,
  MailProviderSettingsDocument,
  MailProviderType,
  SettingMailProvider,
  UpdateMailProviderSettingDocument,
} from '@wepublish/editor/api';
import { Box, Typography } from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { FieldDefinition } from './genericIntegrationForm';
import { mailProviderOptions } from './integrationCatalog';
import { GenericIntegrationList } from './genericIntegrationList';
import { secretPlaceholder } from './secretPlaceholder';

const mailSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(MailProviderType).nullish(),

  fromAddress: z.string().nullish().or(z.literal('')),
  replyToAddress: z.string().nullish().or(z.literal('')),

  apiKey: z.string().nullish().or(z.literal('')),
  webhookEndpointSecret: z.string().nullish().or(z.literal('')),

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
  MailProviderType.Brevo,
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

export function mailFields(
  setting: SettingMailProvider,
  t: TFunction,
  typeOptions: { label: string; value: string }[]
): FieldDefinition<IntegrationFormValues>[] {
  const commonFields: FieldDefinition<IntegrationFormValues>[] = [
    {
      name: 'type',
      half: true,
      label: t('integrations.mailSettings.type'),
      info: t('integrations.mailSettings.typeInfo'),
      type: 'select',
      options: typeOptions,
      section: t('integrations.sections.provider'),
    },
    {
      type: 'text',
      name: 'name',
      half: true,
      label: t('name'),
      info: t('integrations.nameInfo'),
      section: t('integrations.sections.provider'),
    },
    {
      type: 'text',
      name: 'fromAddress',
      half: true,
      section: t('integrations.sections.sender'),
      label: t('integrations.mailSettings.fromAddress'),
      info: t('integrations.mailSettings.fromAddressInfo'),
    },
    {
      type: 'text',
      name: 'replyToAddress',
      half: true,
      label: t('integrations.mailSettings.replyToAddress'),
      info: t('integrations.mailSettings.replyToAddressInfo'),
      section: t('integrations.sections.sender'),
    },
  ];
  const connection = t('integrations.sections.connection');

  const webhookSecretInfo: Partial<Record<MailProviderType, string>> = {
    [MailProviderType.Mailchimp]: t(
      'integrations.mailSettings.webhookSecretInfo.mandrill'
    ),
    [MailProviderType.Mailgun]: t(
      'integrations.mailSettings.webhookSecretInfo.mailgun'
    ),
    [MailProviderType.Brevo]: t(
      'integrations.mailSettings.webhookSecretInfo.brevo'
    ),
  };

  const apiKeyInfo: Partial<Record<MailProviderType, string>> = {
    [MailProviderType.Mailchimp]: t(
      'integrations.mailSettings.apiKeyInfoByType.mandrill'
    ),
    [MailProviderType.Mailgun]: t(
      'integrations.mailSettings.apiKeyInfoByType.mailgun'
    ),
    [MailProviderType.Brevo]: t(
      'integrations.mailSettings.apiKeyInfoByType.brevo'
    ),
  };

  if (setting.type && webhookSecretInfo[setting.type]) {
    commonFields.push({
      section: connection,
      name: 'apiKey',
      label: t('integrations.mailSettings.apiKey'),
      info: apiKeyInfo[setting.type],
      type: 'password',
      autoComplete: 'one-time-code',
      placeholder: secretPlaceholder(setting.isApiKeySet, t),
    });
    commonFields.push({
      section: connection,
      name: 'webhookEndpointSecret',
      label: t('integrations.mailSettings.webhookEndpointSecret'),
      info: webhookSecretInfo[setting.type],
      type: 'password',
      autoComplete: 'one-time-code',
      placeholder: secretPlaceholder(setting.isWebhookEndpointSecretSet, t),
    });
  }

  if (setting.type === MailProviderType.Mailgun) {
    commonFields.push({
      section: connection,
      type: 'text',
      name: 'mailgun_baseDomain',
      half: true,
      label: t('integrations.mailSettings.mailgunBaseDomain'),
      info: t('integrations.mailSettings.mailgunBaseDomainInfo'),
    });
    commonFields.push({
      section: connection,
      type: 'text',
      name: 'mailgun_mailDomain',
      half: true,
      label: t('integrations.mailSettings.mailgunMailDomain'),
      info: t('integrations.mailSettings.mailgunMailDomainInfo'),
    });
  }

  if (setting.type === MailProviderType.Slack) {
    commonFields.push({
      section: connection,
      type: 'text',
      name: 'slack_webhookURL',
      label: t('integrations.mailSettings.slackWebhookUrl'),
      info: t('integrations.mailSettings.slackWebhookUrlInfo'),
    });
  }

  if (setting.type === MailProviderType.Smtp) {
    commonFields.push({
      section: connection,
      type: 'text',
      name: 'smtp_host',
      half: true,
      label: t('integrations.mailSettings.smtpHost'),
      info: t('integrations.mailSettings.smtpHostInfo'),
    });
    commonFields.push({
      section: connection,
      type: 'number',
      name: 'smtp_port',
      half: true,
      label: t('integrations.mailSettings.smtpPort'),
      info: t('integrations.mailSettings.smtpPortInfo'),
    });
    commonFields.push({
      section: connection,
      type: 'checkbox',
      name: 'smtp_secure',
      label: t('integrations.mailSettings.smtpSecure'),
      info: t('integrations.mailSettings.smtpSecureInfo'),
    });
    commonFields.push({
      section: connection,
      type: 'text',
      name: 'smtp_user',
      half: true,
      label: t('integrations.mailSettings.smtpUser'),
    });
    commonFields.push({
      section: connection,
      name: 'apiKey',
      label: t('integrations.mailSettings.smtpPassword'),
      half: true,
      type: 'password',
      autoComplete: 'one-time-code',
      placeholder: secretPlaceholder(setting.isApiKeySet, t),
    });
  }

  return commonFields;
}

export function MailIntegrationForm() {
  const { t } = useTranslation();
  const providers = mailProviderOptions(t);
  const typeOptions = providers.map(({ type, label }) => ({
    label,
    value: type,
  }));

  return (
    <GenericIntegrationList<SettingMailProvider, IntegrationFormValues>
      integrationKey="mail"
      providers={providers}
      query={MailProviderSettingsDocument}
      mutation={UpdateMailProviderSettingDocument}
      dataKey="mailProviderSettings"
      setup={{
        createMutation: CreateMailProviderSettingDocument,
        types: typeOptions,
      }}
      schema={mailSettingsSchema}
      renderStatus={setting => <MailEvidenceStatus setting={setting} />}
      fields={setting => mailFields(setting, t, typeOptions)}
    />
  );
}
