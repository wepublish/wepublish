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
} from '@wepublish/editor/api';
import { Controller, useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { Explainer, WebsiteAnalyticsWrapper } from './website-analytics';

const adsSchema = z.object({
  sparkLoop: z.object({
    enabled: z.boolean(),
    key: z
      .string()
      .regex(
        /^pub_[a-f0-9]{12}$/,
        'Must be a valid SparkLoop ID (e.g., pub_xxxxxxxxxxxx)'
      )
      .or(z.literal(''))
      .nullish(),
  }),
});

export const WebsiteAds = () => {
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
    formState: { isLoading },
  } = useForm<z.infer<typeof adsSchema>>({
    resolver: zodResolver(adsSchema),
    mode: 'onTouched',
    defaultValues: async payload => {
      const data = await loadSettings();

      return (
        data.data?.websiteSettings.ads ?? (payload as z.infer<typeof adsSchema>)
      );
    },
  });

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        ads: data,
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

      <h3>{t('websiteSettings.ads.sparkLoop.title')}</h3>

      <Controller
        name="sparkLoop.enabled"
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
              label={t('websiteSettings.ads.sparkLoop.enable')}
            />

            <Typography
              variant="body2"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.ads.sparkLoop.sparkLoop"
                components={{
                  url: (
                    <MuiLink
                      href="https://sparkloop.app"
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
        name="sparkLoop.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          watch('sparkLoop.enabled') ?
            <TextField
              {...field}
              label="SparkLoop ID"
              placeholder="pub_xxxxxxxxxxxx"
              error={!!error}
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
              helperText={
                error?.message || (
                  <Trans
                    i18nKey="websiteSettings.ads.sparkLoop.idLocator"
                    components={{
                      url: (
                        <MuiLink
                          href="https://dash.sparkloop.app/settings/script"
                          target="_blank"
                          rel="noreferrer"
                        />
                      ),
                    }}
                  />
                )
              }
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
