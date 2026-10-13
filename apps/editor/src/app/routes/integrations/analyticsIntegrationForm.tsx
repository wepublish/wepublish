import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { alpha, lighten } from '@mui/material';
import {
  AnalyticsProviderType,
  CreateAnalyticsProviderSettingDocument,
  SettingAnalyticsProvider,
  SettingsIntegrationsAnalyticsDocument,
  UpdateAnalyticsProviderSettingDocument,
} from '@wepublish/editor/api';
import { humanizeError } from '@wepublish/ui/editor';
import { ComponentProps, forwardRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import googleLogo from './assets/google.svg';
import { CustomField } from './genericIntegrationForm';
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
});

type IntegrationFormValues = z.infer<typeof analyticsSettingsSchema>;

const showErrors = (error: Error): void => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={8000}
    >
      {humanizeError(error)}
    </Message>
  );
};

const CustomDropzoneWrapper = styled.div<{ dragging: boolean; valid: boolean }>`
  aspect-ratio: 16/9;
  border: 2px dashed
    ${({ theme }) =>
      theme.palette.mode === 'dark' ?
        theme.palette.grey['700']
      : theme.palette.grey['300']};
  background-color: ${({ theme }) =>
    theme.palette.mode === 'dark' ?
      theme.palette.grey['900']
    : theme.palette.grey['100']};
  display: grid;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: var(--rs-radius-md);
  cursor: pointer;

  ${({ valid, theme }) =>
    valid &&
    css`
      border-color: ${theme.palette.mode === 'dark' ?
        alpha(theme.palette.success.main, 0.5)
      : lighten(theme.palette.success.light, 0.5)};
      background-color: ${theme.palette.mode === 'dark' ?
        alpha(theme.palette.success.main, 0.12)
      : lighten(theme.palette.success.light, 0.9)};
    `}

  ${({ dragging, theme }) =>
    dragging &&
    css`
      border-color: ${theme.palette.mode === 'dark' ?
        theme.palette.grey['600']
      : theme.palette.grey['200']};
      background-color: ${theme.palette.mode === 'dark' ?
        theme.palette.grey['800']
      : theme.palette.grey['50']};
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
      dataKey="analyticsProviderSettings"
      schema={analyticsSettingsSchema}
      fixedProvider={{
        id: 'google-analytics',
        type: AnalyticsProviderType.Google,
        name: 'Google Analytics',
        createMutation: CreateAnalyticsProviderSettingDocument,
      }}
      getLogo={() => googleLogo}
      fields={[
        {
          name: 'articlePrefix',
          label: t('integrations.analyticsSettings.articlePrefix'),
          info: t('integrations.analyticsSettings.articlePrefixInfo'),
          type: 'text',
          autoComplete: 'one-time-code',
        },
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
      ]}
    />
  );
}
