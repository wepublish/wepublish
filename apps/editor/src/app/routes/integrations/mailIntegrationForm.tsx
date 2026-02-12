import {
  MailProviderType,
  MailProviderSettingsDocument,
  UpdateMailProviderSettingDocument,
  SettingMailProvider,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { GenericIntegrationList } from './genericIntegrationList';
import { FieldDefinition } from './genericIntegrationForm';

import mailChimpLogo from '../../../assets/integrations/mailchimp.avif';
import slackLogo from '../../../assets/integrations/slack.png';
import mailgunLogo from '../../../assets/integrations/mailgun.svg';

const mailSettingsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.nativeEnum(MailProviderType).optional(),

  fromAddress: z.string().optional(),
  replyToAddress: z.string().optional(),

  apiKey: z.string().optional(),
  webhookEndpointSecret: z.string().optional(),

  mailchimpBaseUrl: z.string().optional(),

  mailgunBaseDomain: z.string().optional(),
  mailgunMailDomain: z.string().optional(),

  slackWebhookUrl: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof mailSettingsSchema>;

export function MailIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingMailProvider, IntegrationFormValues>
      query={MailProviderSettingsDocument}
      mutation={UpdateMailProviderSettingDocument}
      dataKey="mailProviderSettings"
      schema={mailSettingsSchema}
      mapSettingToInitialValues={setting => ({
        id: setting.id,
        name: setting.name || undefined,
        type: setting.type,
        fromAddress: setting.fromAddress || undefined,
        replyToAddress: setting.replyToAddress || undefined,
        apiKey: undefined,
        webhookEndpointSecret: undefined,
        mailchimpBaseUrl: setting.mailchimp_baseURL || undefined,
        mailgunBaseDomain: setting.mailgun_baseDomain || undefined,
        mailgunMailDomain: setting.mailgun_mailDomain || undefined,
        slackWebhookUrl: setting.slack_webhookURL || undefined,
      })}
      mapFormValuesToVariables={(formData, setting) => ({
        updateMailProviderSettingId: setting.id,
        name: formData.name,
        fromAddress: formData.fromAddress,
        replyToAddress: formData.replyToAddress,
        apiKey: formData.apiKey,
        webhookEndpointSecret: formData.webhookEndpointSecret,
        mailchimpBaseUrl: formData.mailchimpBaseUrl,
        mailgunBaseDomain: formData.mailgunBaseDomain,
        mailgunMailDomain: formData.mailgunMailDomain,
        slackWebhookUrl: formData.slackWebhookUrl,
      })}
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
            type: 'select',
            options: Object.values(MailProviderType).map(v => ({
              label: v,
              value: v,
            })),
            disabled: true,
          },
          {
            name: 'name',
            label: t('name'),
          },
          {
            name: 'fromAddress',
            label: t('integrations.mailSettings.fromAddress'),
          },
          {
            name: 'replyToAddress',
            label: t('integrations.mailSettings.replyToAddress'),
          },
        ];

        if (setting.type === MailProviderType.Mailchimp) {
          commonFields.push({
            name: 'apiKey',
            label: t('integrations.mailSettings.apiKey'),
            type: 'password',
            autoComplete: 'off',
          });
          commonFields.push({
            name: 'webhookEndpointSecret',
            label: t('integrations.mailSettings.webhookEndpointSecret'),
            type: 'password',
            autoComplete: 'off',
          });
          commonFields.push({
            name: 'mailchimpBaseUrl',
            label: t('integrations.mailSettings.mailchimpBaseUrl'),
          });
        }

        if (setting.type === MailProviderType.Mailgun) {
          commonFields.push({
            name: 'apiKey',
            label: t('integrations.mailSettings.apiKey'),
            type: 'password',
            autoComplete: 'off',
          });
          commonFields.push({
            name: 'webhookEndpointSecret',
            label: t('integrations.mailSettings.webhookEndpointSecret'),
            type: 'password',
            autoComplete: 'off',
          });
          commonFields.push({
            name: 'mailgunBaseDomain',
            label: t('integrations.mailSettings.mailgunBaseDomain'),
          });
          commonFields.push({
            name: 'mailgunMailDomain',
            label: t('integrations.mailSettings.mailgunMailDomain'),
          });
        }

        if (setting.type === MailProviderType.Slack) {
          commonFields.push({
            name: 'slackWebhookUrl',
            label: t('integrations.mailSettings.slackWebhookUrl'),
          });
        }

        return commonFields;
      }}
    />
  );
}
