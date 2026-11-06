import type { SettingsIntegrationsAiQuery } from '@wepublish/editor/api';
import { type FormDefaultValues, formFields } from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const aiSettingSchema = z.object({
  apiKey: formFields.secret().meta({
    label: 'integrations.aiSettings.apiKey',
    description: 'integrations.aiSettings.apiKeyInfo',
  }),
  systemPrompt: formFields.textarea().nullish().meta({
    label: 'integrations.aiSettings.systemPrompt',
    description: 'integrations.aiSettings.systemPromptInfo',
  }),
});

export type AiSetting = SettingsIntegrationsAiQuery['aiSettings'][number];

export const fromAiSetting = ({
  systemPrompt,
}: AiSetting): FormDefaultValues<typeof aiSettingSchema> => ({
  systemPrompt,
});
