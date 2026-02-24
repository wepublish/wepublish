import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

// @TODO: Have it in a shared library with API
const analyticsSchema = z.object({
  ga: z
    .string()
    .regex(
      /^(G|UA|YT|MO)-[A-Za-z0-9-]+$/,
      'Must be a valid GA ID (e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X)'
    )
    .or(z.literal(''))
    .nullable(),
  gtm: z
    .string()
    .regex(/^GTM-[A-Za-z0-9]+$/, 'Must be a valid GTM ID (e.g., GTM-XXXXXXX)')
    .or(z.literal(''))
    .nullable(),
  pa: z
    .string()
    .regex(
      /^PA-[A-Za-z0-9]+$/,
      'Must be a valid PA ID (e.g., pa-XXXXXXXXXXXXXXXXXXXXX)'
    )
    .or(z.literal(''))
    .nullable(),
});

const WebsiteAnalyticsWrapper = styled.form`
  display: grid;
  gap: 24px;
  grid-auto-columns: auto;
`;

const Explainer = styled.p`
  max-width: 75ch;
`;

export const WebsiteAnalytics = () => {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<z.infer<typeof analyticsSchema>>({
    resolver: zodResolver(analyticsSchema),
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(console.log, console.warn);

  const loading = Math.random() > 0.5;
  const data = {
    ga: null,
    gtm: null,
    pa: null,
  };

  return (
    <WebsiteAnalyticsWrapper onSubmit={onSubmit}>
      <h3>{t('websiteSettings.analytics.google.title')}</h3>

      <Typography
        variant="body2"
        color="whisper"
        component={Explainer}
      >
        <Trans
          i18nKey="websiteSettings.analytics.google.ga"
          components={{
            url: (
              <Link
                href="https://developers.google.com/analytics"
                target="_blank"
                rel="noreferrer"
              />
            ),
          }}
        />
      </Typography>

      <Controller
        name="ga"
        control={control}
        defaultValue={data.ga}
        render={({ field, fieldState: { error } }) => (
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
                      <Link
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
        )}
      />

      <Typography
        variant="body2"
        component={Explainer}
      >
        <Trans
          i18nKey="websiteSettings.analytics.google.gtm"
          components={{
            url: (
              <Link
                href="https://marketingplatform.google.com/about/tag-manager/"
                target="_blank"
                rel="noreferrer"
              />
            ),
          }}
        />
      </Typography>

      <Controller
        name="gtm"
        control={control}
        defaultValue={data.gtm}
        render={({ field, fieldState: { error } }) => (
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
                      <Link
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
        )}
      />

      <h3>{t('websiteSettings.analytics.plausible.title')}</h3>

      <Typography
        variant="body2"
        component={Explainer}
      >
        <Trans
          i18nKey="websiteSettings.analytics.plausible.pa"
          components={{
            url: (
              <Link
                href="https://plausible.io"
                target="_blank"
                rel="noreferrer"
              />
            ),
          }}
        />
      </Typography>

      <Controller
        name="pa"
        control={control}
        defaultValue={data.pa}
        render={({ field, fieldState: { error } }) => (
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
                      <Link
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
        )}
      />

      <Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading && (
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
