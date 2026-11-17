import {
  CreatePdfRendererSettingDocument,
  DeletePdfRendererSettingDocument,
  PdfRendererSettingsDocument,
  PdfRendererType,
  SettingPdfRenderer,
  UpdatePdfRendererSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';
import { providersOf, typeOptionsOf } from './integrationCatalog';

const pdfRendererSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(PdfRendererType).nullish(),

  cloudflare_accountId: z.string().nullish().or(z.literal('')),
  cloudflare_apiToken: z.string().nullish().or(z.literal('')),

  gotenberg_url: z.string().nullish().or(z.literal('')),
  gotenberg_username: z.string().nullish().or(z.literal('')),
  gotenberg_password: z.string().nullish().or(z.literal('')),

  timeoutMs: z.coerce.number().int().nonnegative().nullish(),
});

type IntegrationFormValues = z.infer<typeof pdfRendererSettingsSchema>;

export function PdfRendererIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingPdfRenderer, IntegrationFormValues>
      integrationKey="pdf-renderer"
      providers={providersOf('pdf-renderer', t)}
      query={PdfRendererSettingsDocument}
      mutation={UpdatePdfRendererSettingDocument}
      dataKey="pdfRendererSettings"
      registry={{
        createMutation: CreatePdfRendererSettingDocument,
        deleteMutation: DeletePdfRendererSettingDocument,
        types: typeOptionsOf(providersOf('pdf-renderer', t)),
      }}
      schema={pdfRendererSettingsSchema}
      fields={setting => {
        const commonFields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'type',
            half: true,
            label: t('integrations.pdfRendererSettings.type'),
            type: 'select',
            options: typeOptionsOf(providersOf('pdf-renderer', t)),
          },
          {
            type: 'text',
            name: 'name',
            half: true,
            label: t('name'),
          },
        ];

        if (setting.type === PdfRendererType.Cloudflare) {
          commonFields.push({
            type: 'text',
            name: 'cloudflare_accountId',
            half: true,
            label: t('integrations.pdfRendererSettings.cloudflareAccountId'),
            info: t('integrations.pdfRendererSettings.cloudflareAccountIdInfo'),
          });
          commonFields.push({
            name: 'cloudflare_apiToken',
            half: true,
            label: t('integrations.pdfRendererSettings.cloudflareApiToken'),
            info: t('integrations.pdfRendererSettings.cloudflareApiTokenInfo'),
            type: 'password',
            placeholder: t('integrations.placeholderSecret'),
            autoComplete: 'one-time-code',
          });
        }

        if (setting.type === PdfRendererType.Gotenberg) {
          commonFields.push({
            type: 'text',
            name: 'gotenberg_url',
            label: t('integrations.pdfRendererSettings.gotenbergUrl'),
            info: t('integrations.pdfRendererSettings.gotenbergUrlInfo'),
            placeholder: 'http://gotenberg:3000',
          });
          commonFields.push({
            type: 'text',
            name: 'gotenberg_username',
            half: true,
            label: t('integrations.pdfRendererSettings.gotenbergUsername'),
          });
          commonFields.push({
            name: 'gotenberg_password',
            half: true,
            label: t('integrations.pdfRendererSettings.gotenbergPassword'),
            type: 'password',
            placeholder: t('integrations.placeholderSecret'),
            autoComplete: 'one-time-code',
          });
        }

        commonFields.push({
          type: 'number',
          name: 'timeoutMs',
          label: t('integrations.pdfRendererSettings.timeoutMs'),
          info: t('integrations.pdfRendererSettings.timeoutMsInfo'),
          placeholder: '60000',
        });

        return commonFields;
      }}
    />
  );
}
