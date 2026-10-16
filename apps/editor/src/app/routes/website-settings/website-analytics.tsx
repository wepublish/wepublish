import { useLazyQuery, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Link as MuiLink,
  TextField,
  Typography,
} from '@mui/material';
import {
  UpdateWebsiteSettingsDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import { enqueueSnackbar, humanizeError } from '@wepublish/ui/editor';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import { WebsiteSettingsHeader } from './website-settings-header';

import { lazyMessage } from '../../utility';

const analyticsSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean(),
    key: z
      .string({
        errorMap: lazyMessage('websiteSettings.analytics.google.gaInvalid'),
      })
      .regex(/^(G|UA|YT|MO)-[A-Za-z0-9-]+$/)
      .or(z.literal(''))
      .nullish(),
  }),
  googleTagManager: z.object({
    enabled: z.boolean(),
    key: z
      .string({
        errorMap: lazyMessage('websiteSettings.analytics.google.gtmInvalid'),
      })
      .regex(/^GTM-[A-Za-z0-9]+$/)
      .or(z.literal(''))
      .nullish(),
  }),
  plausible: z.object({
    enabled: z.boolean(),
    key: z
      .string({
        errorMap: lazyMessage('websiteSettings.analytics.plausible.paInvalid'),
      })
      .regex(/^PA-[A-Za-z0-9_-]+$/i)
      .or(z.literal(''))
      .nullish(),
  }),
  piwik: z.object({
    enabled: z.boolean(),
    key: z
      .string({
        errorMap: lazyMessage('websiteSettings.analytics.piwik.proInvalid'),
      })
      .or(z.literal(''))
      .nullish(),
  }),
});

export const WebsiteAnalyticsWrapper = styled.form`
  display: grid;
  gap: 24px;
  grid-auto-columns: auto;
`;

export const Explainer = styled.p`
  max-width: 75ch;
`;

export const WebsiteAnalytics = () => {
  const { t } = useTranslation();
  const [loadSettings] = useLazyQuery(WebsiteSettingsDocument);
  const [updateWebsiteSettings, { loading: saving }] = useMutation(
    UpdateWebsiteSettingsDocument,
    {
      onCompleted: () => {
        enqueueSnackbar(t('websiteSettings.saveSuccess'), {
          variant: 'success',
          autoHideDuration: 3000,
        });
      },
      onError: error => {
        enqueueSnackbar(humanizeError(error), {
          variant: 'error',
          autoHideDuration: 8000,
        });
      },
    }
  );
  const {
    control,
    handleSubmit,
    formState: { isLoading },
  } = useForm<z.infer<typeof analyticsSchema>>({
    resolver: zodResolver(analyticsSchema),
    mode: 'onTouched',
    defaultValues: async payload => {
      const data = await loadSettings();

      return (
        data.data?.websiteSettings.analytics ??
        (payload as z.infer<typeof analyticsSchema>)
      );
    },
  });

  const googleAnalyticsEnabled = useWatch({
    control,
    name: 'googleAnalytics.enabled',
  });
  const googleTagManagerEnabled = useWatch({
    control,
    name: 'googleTagManager.enabled',
  });
  const plausibleEnabled = useWatch({ control, name: 'plausible.enabled' });
  const piwikEnabled = useWatch({ control, name: 'piwik.enabled' });

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        analytics: data,
      },
    });
  }, console.warn);

  if (isLoading) {
    return (
      <CircularProgress
        size={14}
        color="inherit"
        sx={{ mr: 1 }}
      />
    );
  }

  return (
    <WebsiteAnalyticsWrapper onSubmit={onSubmit}>
      <WebsiteSettingsHeader title={t('websiteSettings.analytics.title')}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          loading={saving}
        >
          {t('save')}
        </Button>
      </WebsiteSettingsHeader>
      <Typography variant="h3">
        {t('websiteSettings.analytics.google.title')}
      </Typography>
      <Controller
        name="googleAnalytics.enabled"
        control={control}
        render={({ field }) => (
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                />
              }
              label={t('websiteSettings.analytics.google.gaEnable')}
            />

            <Typography
              variant="body2"
              color="whisper"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.analytics.google.ga"
                components={{
                  url: (
                    <MuiLink
                      href="https://developers.google.com/analytics"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
          </div>
        )}
      />
      <Controller
        name="googleAnalytics.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          googleAnalyticsEnabled ?
            <TextField
              {...field}
              label="Google Analytics ID"
              placeholder="G-XXXXXXXXXX"
              error={!!error}
              helperText={
                error?.message || (
                  <Trans
                    i18nKey="websiteSettings.analytics.google.gaLocator"
                    components={{
                      url: (
                        <MuiLink
                          href="https://support.google.com/analytics/answer/9539598"
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                    }}
                  />
                )
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                        }}
                      >
                        ID
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          : <></>
        }
      />
      <Controller
        name="googleTagManager.enabled"
        control={control}
        render={({ field }) => (
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                />
              }
              label={t('websiteSettings.analytics.google.gtmEnable')}
            />

            <Typography
              variant="body2"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.analytics.google.gtm"
                components={{
                  url: (
                    <MuiLink
                      href="https://marketingplatform.google.com/about/tag-manager/"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
          </div>
        )}
      />
      <Controller
        name="googleTagManager.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          googleTagManagerEnabled ?
            <TextField
              {...field}
              label="Google Tag Manager ID"
              placeholder="GTM-XXXXXXX"
              error={!!error}
              helperText={
                error?.message || (
                  <Trans
                    i18nKey="websiteSettings.analytics.google.gtmLocator"
                    components={{
                      url: (
                        <MuiLink
                          href="https://support.google.com/tagmanager/answer/15107467"
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                    }}
                  />
                )
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                        }}
                      >
                        ID
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          : <></>
        }
      />
      <Typography variant="h3">
        {t('websiteSettings.analytics.plausible.title')}
      </Typography>
      <Controller
        name="plausible.enabled"
        control={control}
        render={({ field }) => (
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                />
              }
              label={t('websiteSettings.analytics.plausible.enable')}
            />

            <Typography
              variant="body2"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.analytics.plausible.pa"
                components={{
                  url: (
                    <MuiLink
                      href="https://plausible.io"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
          </div>
        )}
      />
      <Controller
        name="plausible.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          plausibleEnabled ?
            <TextField
              {...field}
              label="Plausible ID"
              placeholder="pa-XXXXXXXXXXXXXXXXXXXXX"
              error={!!error}
              helperText={
                error?.message || (
                  <Trans
                    i18nKey="websiteSettings.analytics.plausible.paLocator"
                    components={{
                      url: (
                        <MuiLink
                          href="https://plausible.io/docs/website-settings"
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                    }}
                  />
                )
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                        }}
                      >
                        ID
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          : <></>
        }
      />
      <Typography variant="h3">
        {t('websiteSettings.analytics.piwik.title')}
      </Typography>
      <Controller
        name="piwik.enabled"
        control={control}
        render={({ field }) => (
          <div>
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={!!field.value}
                />
              }
              label={t('websiteSettings.analytics.piwik.enable')}
            />

            <Typography
              variant="body2"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.analytics.piwik.pro"
                components={{
                  url: (
                    <MuiLink
                      href="https://piwik.pro"
                      target="_blank"
                      rel="noreferrer"
                    />
                  ),
                }}
              />
            </Typography>
          </div>
        )}
      />
      <Controller
        name="piwik.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          piwikEnabled ?
            <TextField
              {...field}
              label="piwik ID"
              placeholder="xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              error={!!error}
              helperText={
                error?.message || (
                  <Trans i18nKey="websiteSettings.analytics.piwik.proLocator" />
                )
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'text.secondary',
                          fontSize: '0.8rem',
                        }}
                      >
                        ID
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />
          : <></>
        }
      />
    </WebsiteAnalyticsWrapper>
  );
};
