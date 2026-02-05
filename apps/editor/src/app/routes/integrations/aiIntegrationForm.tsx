import { zodResolver } from '@hookform/resolvers/zod';
import {
  getApiClientV2,
  SettingAiProvider,
  useSettingsIntegrationsAiQuery,
  useUpdateSettingsIntegrationsAiMutation,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Form, Loader, Message, Panel, toaster } from 'rsuite';
import { z } from 'zod';

const aiSettingsSchema = z.object({
  id: z.string(),
  apiKey: z.string().optional(),
  systemPrompt: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof aiSettingsSchema>;

function SingleAIIntegrationForm({
  setting,
}: {
  setting: Pick<SettingAiProvider, 'id' | 'systemPrompt' | 'name' | 'type'>;
}) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const [updateAiSettings, { loading: updating }] =
    useUpdateSettingsIntegrationsAiMutation({
      client,
    });

  const initialValues = useMemo(
    () => ({
      id: setting.id,
      systemPrompt: setting.systemPrompt || '',
      apiKey: undefined,
    }),
    [setting]
  );

  const { control, handleSubmit } = useForm<IntegrationFormValues>({
    resolver: zodResolver(aiSettingsSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
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

  return (
    <Panel
      header={setting.name || setting.type}
      bordered
      style={{ marginBottom: 20 }}
    >
      <Form
        fluid
        onSubmit={() => handleSubmit(onSubmit)()}
        disabled={updating}
      >
        <Form.Group controlId={`apiKey-${setting.id}`}>
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
                  autoComplete="off"
                />
              </>
            )}
          />
        </Form.Group>

        <Form.Group controlId={`systemPrompt-${setting.id}`}>
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
    </Panel>
  );
}

export function AIIntegrationForm() {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const { data, loading, error } = useSettingsIntegrationsAiQuery({
    client,
  });

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;
  if (!data?.aiSettings?.length)
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );

  return (
    <div>
      {data.aiSettings.map(setting => (
        <SingleAIIntegrationForm
          key={setting.id}
          setting={setting}
        />
      ))}
    </div>
  );
}
