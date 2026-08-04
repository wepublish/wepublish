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

const mailSchema = z.object({
  mailchimp: z.object({
    enabled: z.boolean(),
    key: z
      .string()
      .regex(
        /^[a-f0-9]{32}-us\d{1,2}$/,
        'Must be a valid Mailchimp API-Key (e.g., XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-us1)'
      )
      .or(z.literal(''))
      .nullish(),
  }),
});

export const WebsiteMail = () => {
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
  } = useForm<z.infer<typeof mailSchema>>({
    resolver: zodResolver(mailSchema),
    mode: 'onTouched',
    defaultValues: async () => {
      const data = await loadSettings();

      return {
        mailchimp: { enabled: false, key: undefined },
        ...data.data?.websiteSettings.mail,
      } as z.infer<typeof mailSchema>;
    },
  });

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({
      variables: {
        mail: data,
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

      <h3>{t('websiteSettings.mail.mailchimp.title')}</h3>

      <Controller
        name="mailchimp.enabled"
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
              label={t('websiteSettings.mail.mailchimp.enable')}
            />

            <Typography
              variant="body2"
              component={Explainer}
            >
              <Trans
                i18nKey="websiteSettings.mail.mailchimp.mailchimp"
                components={{
                  url: (
                    <MuiLink
                      href="https://mailchimp.com"
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
        name="mailchimp.key"
        control={control}
        render={({ field, fieldState: { error } }) =>
          watch('mailchimp.enabled') ?
            <TextField
              {...field}
              label="Mailchimp API-Key"
              placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-usX(X)"
              error={!!error}
              helperText={
                error?.message || (
                  <Trans
                    i18nKey="websiteSettings.mail.mailchimp.apiKeyLocator"
                    components={{
                      url: (
                        <MuiLink
                          href="https://admin.mailchimp.com/account/api/"
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
                      API
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
