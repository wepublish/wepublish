import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { lighten } from '@mui/material';
import {
  AnalyticsProviderType,
  CreateAnalyticsProviderSettingDocument,
  SettingAnalyticsProvider,
  SettingsIntegrationsAnalyticsDocument,
  UpdateAnalyticsProviderSettingDocument,
} from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { ComponentProps, forwardRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import googleLogo from './assets/google.svg';
import plausibleLogo from './assets/plausible.svg';
import umamiLogo from './assets/umami.svg';
import { CustomField, FieldDefinition } from './genericIntegrationForm';
import { GenericIntegrationList } from './genericIntegrationList';

const credentialsSchema = z.object({
  type: z.string(),
  project_id: z.string(),
  private_key_id: z.string(),
  private_key: z.string(),
  client_email: z.string(),
  client_id: z.string(),
});

const analyticsSettingsSchema = z.object({
  property: z.string().nullish().or(z.literal('')),
  articlePrefix: z.string().nullish().or(z.literal('')),
  credentials: credentialsSchema.nullish(),
  apiKey: z.string().nullish().or(z.literal('')),
  url: z.string().url().nullish().or(z.literal('')),
  hotAndTrending: z.boolean().nullish(),
});

type IntegrationFormValues = z.infer<typeof analyticsSettingsSchema>;

const showErrors = (error: Error): void => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const CustomDropzoneWrapper = styled.div<{ dragging: boolean; valid: boolean }>`
  aspect-ratio: 16/9;
  border: 2px dashed ${({ theme }) => theme.vars.palette.grey['300']};
  background-color: ${({ theme }) => theme.vars.palette.grey['100']};

  [data-mui-color-scheme='dark'] & {
    border-color: ${({ theme }) => theme.vars.palette.grey['700']};
    background-color: ${({ theme }) => theme.vars.palette.grey['900']};
  }

  display: grid;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  cursor: pointer;

  ${({ valid, theme }) =>
    valid &&
    css`
      border-color: ${lighten(theme.palette.success.light, 0.5)};
      background-color: ${lighten(theme.palette.success.light, 0.9)};

      [data-mui-color-scheme='dark'] & {
        border-color: rgba(${theme.vars.palette.success.mainChannel} / 0.5);
        background-color: rgba(
          ${theme.vars.palette.success.mainChannel} / 0.12
        );
      }
    `}

  ${({ dragging, theme }) =>
    dragging &&
    css`
      border-color: ${theme.vars.palette.grey['200']};
      background-color: ${theme.vars.palette.grey['50']};

      [data-mui-color-scheme='dark'] & {
        border-color: ${theme.vars.palette.grey['600']};
        background-color: ${theme.vars.palette.grey['800']};
      }
    `}
`;

const CustomDropzone = forwardRef<
  HTMLInputElement,
  ComponentProps<CustomField<IntegrationFormValues['credentials']>['render']>
>(({ onChange, disabled, value }, ref) => {
  const { t } = useTranslation();

  const onDrop = useCallback(
    ([acceptedFile]: File[]) => {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const value = credentialsSchema.parse(json);

          onChange(value);
        } catch (error) {
          showErrors(
            new Error(t('integrations.analyticsSettings.invalidFile'))
          );
        }
      };
      reader.onerror = () => {
        showErrors(
          new Error(t('integrations.analyticsSettings.readFileError'))
        );
      };
      reader.readAsText(acceptedFile);
    },
    [onChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': [],
      'application/json': [],
    },
    multiple: false,
    onError: showErrors,
    preventDropOnDocument: true,
    disabled,
  });

  return (
    <CustomDropzoneWrapper
      {...getRootProps()}
      dragging={isDragActive}
      valid={!!value}
    >
      <input {...getInputProps()} />

      {isDragActive ?
        t('integrations.analyticsSettings.dropCredentialsFile')
      : value ?
        t('integrations.analyticsSettings.credentialsReadyToBeSaved')
      : t('integrations.analyticsSettings.dragCredentialsFileHere')}
    </CustomDropzoneWrapper>
  );
});

export function AnalyticsIntegrationForm() {
  const { t } = useTranslation();

  return (
    <GenericIntegrationList<SettingAnalyticsProvider, IntegrationFormValues>
      query={SettingsIntegrationsAnalyticsDocument}
      mutation={UpdateAnalyticsProviderSettingDocument}
      // Choosing a provider for Hot & Trending unchecks the others
      refetchQueries={[SettingsIntegrationsAnalyticsDocument]}
      dataKey="analyticsProviderSettings"
      schema={analyticsSettingsSchema}
      fixedProvider={{
        id: 'google-analytics',
        type: AnalyticsProviderType.Google,
        name: 'Google Analytics',
        createMutation: CreateAnalyticsProviderSettingDocument,
      }}
      getLogo={setting => {
        switch (setting.type) {
          case AnalyticsProviderType.Plausible:
            return plausibleLogo;
          case AnalyticsProviderType.Umami:
            return umamiLogo;
          default:
            return googleLogo;
        }
      }}
      fields={setting => {
        const fields: FieldDefinition<IntegrationFormValues>[] = [
          {
            name: 'hotAndTrending',
            label: t('integrations.analyticsSettings.hotAndTrending'),
            info: t('integrations.analyticsSettings.hotAndTrendingInfo'),
            type: 'checkbox',
          },
          {
            name: 'articlePrefix',
            label: t('integrations.analyticsSettings.articlePrefix'),
            info: t('integrations.analyticsSettings.articlePrefixInfo'),
            type: 'text',
            autoComplete: 'one-time-code',
          },
        ];

        switch (setting.type) {
          case AnalyticsProviderType.Plausible:
            return [
              ...fields,
              {
                name: 'property',
                label: t('integrations.analyticsSettings.plausibleSiteId'),
                info: t('integrations.analyticsSettings.plausibleSiteIdInfo'),
                placeholder: 'example.com',
                type: 'text',
                autoComplete: 'one-time-code',
              },
              {
                name: 'apiKey',
                label: t('integrations.analyticsSettings.apiKey'),
                info: t('integrations.analyticsSettings.plausibleApiKeyInfo'),
                type: 'password',
                autoComplete: 'one-time-code',
                placeholder: t('integrations.placeholderSecret'),
              },
              {
                name: 'url',
                label: t('integrations.analyticsSettings.plausibleUrl'),
                info: t('integrations.analyticsSettings.plausibleUrlInfo'),
                placeholder: 'https://plausible.io',
                type: 'text',
                autoComplete: 'one-time-code',
              },
            ];

          case AnalyticsProviderType.Umami:
            return [
              ...fields,
              {
                name: 'property',
                label: t('integrations.analyticsSettings.umamiWebsiteId'),
                info: t('integrations.analyticsSettings.umamiWebsiteIdInfo'),
                placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                type: 'text',
                autoComplete: 'one-time-code',
              },
              {
                name: 'apiKey',
                label: t('integrations.analyticsSettings.apiKey'),
                info: t('integrations.analyticsSettings.umamiApiKeyInfo'),
                type: 'password',
                autoComplete: 'one-time-code',
                placeholder: t('integrations.placeholderSecret'),
              },
              {
                name: 'url',
                label: t('integrations.analyticsSettings.umamiUrl'),
                info: t('integrations.analyticsSettings.umamiUrlInfo'),
                placeholder: 'https://api.umami.is/v1',
                type: 'text',
                autoComplete: 'one-time-code',
              },
            ];

          default:
            return [
              ...fields,
              {
                name: 'property',
                label: t('integrations.analyticsSettings.property'),
                info: t('integrations.analyticsSettings.propertyInfo'),
                type: 'text',
                autoComplete: 'one-time-code',
              },
              {
                name: 'credentials',
                label: t('integrations.analyticsSettings.credentials'),
                info: t('integrations.analyticsSettings.credentialsInfo'),
                type: 'custom',
                render: CustomDropzone,
              },
            ];
        }
      }}
    />
  );
}
