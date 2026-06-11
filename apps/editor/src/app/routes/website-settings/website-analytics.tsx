import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
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
  useUpdateWebsiteSettingsMutation,
  useWebsiteSettingsLazyQuery,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

const analyticsSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean(),
    key: z
      .string()
      .regex(
        /^(G|UA|YT|MO)-[A-Za-z0-9-]+$/,
        'Must be a valid GA ID (e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X)'
      )
      .or(z.literal(''))
      .nullish(),
  }),
  googleTagManager: z.object({
    enabled: z.boolean(),
    key: z
      .string()
      .regex(/^GTM-[A-Za-z0-9]+$/, 'Must be a valid GTM ID (e.g., GTM-XXXXXXX)')
      .or(z.literal(''))
      .nullish(),
  }),
  plausible: z.object({
    enabled: z.boolean(),
    key: z
      .string()
      .regex(
        /^PA-[A-Za-z0-9_]+$/i,
        'Must be a valid PA ID (e.g., pa-XXXXXXXXXXXXXXXXXXXX)'
      )
      .or(z.literal(''))
      .nullish(),
  }),
  piwik: z.object({
    enabled: z.boolean(),
    key: z
      .string({
        message:
          'Must be a valid Piwik ID (e.g., xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
      })
      .or(z.literal(''))
      .nullish(),
  }),
});

const stripTypename = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(stripTypename) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__typename') {
        continue;
      }
      out[k] = stripTypename(v);
    }
    return out as T;
  }
  return value;
};

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
  const [loadSettings] = useWebsiteSettingsLazyQuery();
  const [updateWebsiteSettings, { loading: saving }] =
    useUpdateWebsiteSettingsMutation({
      onCompleted: () => {
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={3000}
          >
            {t('websiteSettings.saveSuccess')}
          </Message>
        );
      },
      onError: error => {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={3000}
          >
            {error.message}
          </Message>
        );
      },
    });
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isLoading },
  } = useForm<z.infer<typeof analyticsSchema>>({
    resolver: zodResolver(analyticsSchema),
    mode: 'onTouched',
    defaultValues: async payload => {
      const data = await loadSettings();

      return (
        stripTypename(data.data?.websiteSettings.analytics) ??
        (payload as z.infer<typeof analyticsSchema>)
      );
    },
  });

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        analytics: stripTypename(data),
      },
      refetchQueries: [{ query: WebsiteSettingsDocument }],
      awaitRefetchQueries: true,
      onCompleted: result => {
        const fresh = stripTypename(result.updateWebsiteSettings?.analytics);
        if (fresh) {
          reset(fresh);
        }
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
      <Link to={'/settings/website'}>
        <Button
          size="small"
          variant="text"
          startIcon={<MdArrowBack />}
        >
          {t('websiteSettings.backToOverview')}
        </Button>
      </Link>

      <h3>{t('websiteSettings.analytics.google.title')}</h3>

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
          watch('googleAnalytics.enabled') ?
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
              InputProps={{
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
          watch('googleTagManager.enabled') ?
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
              InputProps={{
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
              }}
            />
          : <></>
        }
      />

      <h3>{t('websiteSettings.analytics.plausible.title')}</h3>

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
          watch('plausible.enabled') ?
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
              InputProps={{
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
              }}
            />
          : <></>
        }
      />

      <h3>{t('websiteSettings.analytics.piwik.title')}</h3>

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
          watch('piwik.enabled') ?
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
              InputProps={{
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
              }}
            />
          : <></>
        }
      />

      <Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
        >
          {saving && (
            <CircularProgress
              size={14}
              color="inherit"
              sx={{ mr: 1 }}
            />
          )}

          {t('save')}
        </Button>
      </Box>
    </WebsiteAnalyticsWrapper>
  );
};
