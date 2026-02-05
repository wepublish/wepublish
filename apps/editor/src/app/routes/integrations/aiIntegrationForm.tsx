import { zodResolver } from '@hookform/resolvers/zod';
import {
  getApiClientV2,
  useSettingsIntegrationsAiQuery,
  useUpdateSettingsIntegrationsAiMutation,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Form, Loader, Message, toaster } from 'rsuite';
import { z } from 'zod';

const aiSettingsSchema = z.object({
  id: z.string(),
  apiKey: z.string().optional(),
  systemPrompt: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof aiSettingsSchema>;

export function AIIntegrationForm() {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const { data, loading, error } = useSettingsIntegrationsAiQuery({
    client,
  });
  const [updateAiSettings, { loading: updating }] =
    useUpdateSettingsIntegrationsAiMutation({
      client,
    });

  const settings = data?.aiSettings?.[0];
  const initialValues = useMemo(
    () =>
      settings ?
        {
          id: settings.id,
          systemPrompt: settings.systemPrompt || '',
          apiKey: undefined,
        }
      : undefined,
    [settings]
  );

  const { control, handleSubmit } = useForm<IntegrationFormValues>({
    resolver: zodResolver(aiSettingsSchema),
    mode: 'onTouched',
    values: initialValues,
  });

  const onSubmit = async (formData: IntegrationFormValues) => {
    try {
      await updateAiSettings({
        variables: {
          updateAiSettingId: formData.id,
          apiKey: formData.apiKey,
          systemPrompt: formData.systemPrompt,
        },
      });
      toaster.push(
        <Message type="success">{t('integrations.updateSuccess')}</Message>
      );
    } catch (e) {
      toaster.push(
        <Message type="error">{t('integrations.updateError')}</Message>
      );
      console.error(e);
    }
  };

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;
  if (!data?.aiSettings?.length)
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );

  return (
    <Form
      fluid
      onSubmit={() => handleSubmit(onSubmit)()}
      disabled={updating}
    >
      <Form.Group controlId="apiKey">
        <Form.ControlLabel>
          {t('integrations.aiSettings.apiKey')}
        </Form.ControlLabel>
        <Controller
          name="apiKey"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Form.Control
                {...field}
                errorMessage={fieldState.error?.message}
                type="password"
              />
            </>
          )}
        />
      </Form.Group>

      <Form.Group controlId="systemPrompt">
        <Form.ControlLabel>
          {t('integrations.aiSettings.systemPrompt')}
        </Form.ControlLabel>
        <Controller
          name="systemPrompt"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Form.Control
                {...field}
                errorMessage={fieldState.error?.message}
                accepter="textarea"
                rows={5}
              />
            </>
          )}
        />
      </Form.Group>

      <Button
        appearance="primary"
        type="submit"
        loading={updating}
      >
        {t('save')}
      </Button>
    </Form>
  );
}
