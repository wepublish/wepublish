import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChallengeProviderType,
  getApiClientV2,
  SettingChallengeProvider,
  useSettingsIntegrationsChallengeQuery,
  useUpdateSettingsIntegrationsChallengeMutation,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Loader,
  Message,
  Panel,
  SelectPicker,
  toaster,
} from 'rsuite';
import { z } from 'zod';

const challengeSettingsSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.nativeEnum(ChallengeProviderType).optional(),
  secret: z.string().optional(),
  siteKey: z.string().optional(),
});

type IntegrationFormValues = z.infer<typeof challengeSettingsSchema>;

function SingleChallengeIntegrationForm({
  setting,
}: {
  setting: Pick<SettingChallengeProvider, 'id' | 'name' | 'type'>;
}) {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const [updateChallengeSettings, { loading: updating }] =
    useUpdateSettingsIntegrationsChallengeMutation({
      client,
    });

  const initialValues = useMemo(
    () => ({
      id: setting.id,
      name: setting.name || '',
      type: setting.type,
      secret: undefined,
      siteKey: undefined,
    }),
    [setting]
  );

  const { control, handleSubmit } = useForm<IntegrationFormValues>({
    resolver: zodResolver(challengeSettingsSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    values: initialValues,
  });

  const onSubmit = async (formData: IntegrationFormValues) => {
    try {
      await updateChallengeSettings({
        variables: {
          updateChallengeProviderSettingId: formData.id,
          name: formData.name,
          secret: formData.secret || undefined,
          siteKey: formData.siteKey || undefined,
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
        <Form.Group controlId={`type-${setting.id}`}>
          <Form.ControlLabel>
            {t('integrations.challengeSettings.type')}
          </Form.ControlLabel>
          <SelectPicker
            data={Object.values(ChallengeProviderType).map(v => ({
              label: v,
              value: v,
            }))}
            value={setting.type}
            disabled
            cleanable={false}
            searchable={false}
          />
        </Form.Group>

        <Form.Group controlId={`name-${setting.id}`}>
          <Form.ControlLabel>{t('name')}</Form.ControlLabel>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Form.Control
                  {...field}
                  errorMessage={fieldState.error?.message}
                />
              </>
            )}
          />
        </Form.Group>

        <Form.Group controlId={`secret-${setting.id}`}>
          <Form.ControlLabel>
            {t('integrations.challengeSettings.secret')}
          </Form.ControlLabel>
          <Controller
            name="secret"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Form.Control
                  {...field}
                  placeholder={t('integrations.placeholderSecret')}
                  errorMessage={fieldState.error?.message}
                  type="password"
                  autoComplete="off"
                />
              </>
            )}
          />
        </Form.Group>

        <Form.Group controlId={`siteKey-${setting.id}`}>
          <Form.ControlLabel>
            {t('integrations.challengeSettings.siteKey')}
          </Form.ControlLabel>
          <Controller
            name="siteKey"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Form.Control
                  {...field}
                  placeholder={t('integrations.placeholderSecret')}
                  errorMessage={fieldState.error?.message}
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

export function ChallengeIntegrationForm() {
  const { t } = useTranslation();
  const client = getApiClientV2();
  const { data, loading, error } = useSettingsIntegrationsChallengeQuery({
    client,
  });

  if (loading) return <Loader center />;
  if (error) return <Message type="error">{error.message}</Message>;
  if (!data?.challengeProviderSettings?.length)
    return (
      <Message type="warning">{t('integrations.noSettingsFound')}</Message>
    );

  return (
    <div>
      {data.challengeProviderSettings.map(setting => (
        <SingleChallengeIntegrationForm
          key={setting.id}
          setting={setting}
        />
      ))}
    </div>
  );
}
