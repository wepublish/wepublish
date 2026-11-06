import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { FormControl, FormHelperText, FormLabel, lighten } from '@mui/material';
import type { SettingAnalyticsCredentialsInput } from '@wepublish/editor/api';
import { fieldComponent, useField } from '@wepublish/form/editor';
import { enqueueSnackbar, InfoTooltip } from '@wepublish/ui/editor';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

import { analyticsCredentialsSchema } from './analyticsIntegration.schema';
import { credentialsDropzoneText } from './credentialsDropzoneText';

const showError = (message: string) =>
  enqueueSnackbar(message, { variant: 'error', autoHideDuration: 8000 });

const Dropzone = styled.div<{ dragging: boolean; valid: boolean }>`
  min-height: 160px;
  border: 2px dashed ${({ theme }) => theme.vars.palette.grey['300']};
  background-color: ${({ theme }) => theme.vars.palette.grey['100']};

  [data-mui-color-scheme='dark'] & {
    border-color: ${({ theme }) => theme.vars.palette.grey['700']};
    background-color: ${({ theme }) => theme.vars.palette.grey['900']};
  }

  display: grid;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(2)};
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

function CredentialsDropzone({ stored = false }: { stored?: boolean }) {
  const { t } = useTranslation();
  const { ref, ...field } = useField<
    SettingAnalyticsCredentialsInput | null | undefined
  >();
  const labelId = `${field.id}-label`;
  const helperText = field.invalid ? field.error : field.helperText;

  const read = (file: File) => {
    const reader = new FileReader();

    reader.onload = event => {
      const text = event.target === null ? '' : String(event.target.result);
      let json: unknown = null;

      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      const parsed = analyticsCredentialsSchema.safeParse(json);

      if (!parsed.success) {
        showError(t('integrations.analyticsSettings.invalidFile'));

        return;
      }

      field.onChange(parsed.data);
    };
    reader.onerror = () =>
      showError(t('integrations.analyticsSettings.readFileError'));
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: ([file]) => {
      if (file !== undefined) {
        read(file);
      }
    },
    accept: {
      'text/plain': [],
      'application/json': [],
    },
    multiple: false,
    onError: error => showError(error.message),
    preventDropOnDocument: true,
    disabled: field.disabled || field.readOnly,
  });

  return (
    <FormControl
      ref={ref}
      fullWidth
      error={field.invalid}
      disabled={field.disabled}
    >
      {field.hideLabel ? null : (
        <FormLabel
          id={labelId}
          sx={{ mb: 1 }}
        >
          {field.label}
          {field.description ?
            <>
              {' '}
              <InfoTooltip text={field.description} />
            </>
          : null}
        </FormLabel>
      )}

      <Dropzone
        {...getRootProps({
          role: 'button',
          'aria-labelledby': field.hideLabel ? undefined : labelId,
        })}
        dragging={isDragActive}
        valid={!!field.value}
      >
        {credentialsDropzoneText(
          { dragging: isDragActive, newFile: !!field.value, stored },
          t
        )}
      </Dropzone>

      <input
        {...getInputProps({
          name: field.name,
          'aria-labelledby': field.hideLabel ? undefined : labelId,
          'aria-label':
            field.hideLabel && typeof field.label === 'string' ?
              field.label
            : undefined,
        })}
        data-testid="credentialsFile"
      />

      {helperText ?
        <FormHelperText>{helperText}</FormHelperText>
      : null}
    </FormControl>
  );
}

export const CredentialsDropzoneField = fieldComponent<
  SettingAnalyticsCredentialsInput | null | undefined
>()(CredentialsDropzone);
