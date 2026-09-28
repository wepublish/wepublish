import {
  PdfRendererSettingsDocument,
  PdfRendererType,
  SettingPdfRenderer,
  UpdatePdfRendererSettingDocument,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const pdfRendererSettingsSchema = z.object({
  name: z.string().nullish().or(z.literal('')),
  type: z.nativeEnum(PdfRendererType).nullish(),

  cloudflare_accountId: z.string().nullish().or(z.literal('')),
  cloudflare_apiToken: z.string().nullish().or(z.literal('')),

  timeoutMs: z.coerce.number().int().nonnegative().nullish(),
});

type IntegrationFormValues = z.infer<typeof pdfRendererSettingsSchema>;

export function PdfRendererIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingPdfRenderer, IntegrationFormValues>
      query={PdfRendererSettingsDocument}
      mutation={UpdatePdfRendererSettingDocument}
      dataKey="pdfRendererSettings"
      schema={pdfRendererSettingsSchema}
      fields={setting => {
        const commonFields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'type',
            label: t('integrations.pdfRendererSettings.type'),
            type: 'select',
            options: Object.values(PdfRendererType).map(v => ({
              label: v,
              value: v,
            })),
            disabled: true,
          },
          {
            type: 'text',
            name: 'name',
            label: t('name'),
          },
        ];

        if (setting.type === PdfRendererType.Cloudflare) {
          commonFields.push({
            type: 'text',
            name: 'cloudflare_accountId',
            label: t('integrations.pdfRendererSettings.cloudflareAccountId'),
          });
          commonFields.push({
            name: 'cloudflare_apiToken',
            label: t('integrations.pdfRendererSettings.cloudflareApiToken'),
            type: 'password',
            placeholder: t('integrations.placeholderSecret'),
            autoComplete: 'one-time-code',
          });
        }

        commonFields.push({
          type: 'number',
          name: 'timeoutMs',
          label: t('integrations.pdfRendererSettings.timeoutMs'),
          placeholder: '60000',
        });

        return commonFields;
      }}
    />
  );
}
