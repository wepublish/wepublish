import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  FontStyle,
  FontWeight,
  useUpdateWebsiteSettingsMutation,
  useWebsiteSettingsLazyQuery,
} from '@wepublish/editor/api';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdArrowBack, MdDelete } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Message, toaster } from 'rsuite';
import { z } from 'zod';

import { FontPicker } from './fonts/font-picker';
import { WebsiteAnalyticsWrapper } from './website-analytics';

const fontsSchema = z.array(
  z.object({
    name: z.string(),
    weight: z.array(
      z.enum([
        FontWeight.Thin,
        FontWeight.ExtraLight,
        FontWeight.Light,
        FontWeight.Regular,
        FontWeight.Medium,
        FontWeight.SemiBold,
        FontWeight.Bold,
        FontWeight.ExtraBold,
        FontWeight.Black,
        FontWeight.Variable,
      ])
    ),
    style: z.array(z.enum([FontStyle.Normal, FontStyle.Italic])),
  })
);

const formSchema = z.object({ fonts: fontsSchema });
type FormValues = z.infer<typeof formSchema>;

export const WebsiteFonts = () => {
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
          >
            {t('websiteSettings.saveSuccess')}
          </Message>,
          { duration: 3000 }
        );
      },
      onError: error => {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
          >
            {error.message}
          </Message>,
          { duration: 3000 }
        );
      },
    });

  const {
    control,
    handleSubmit,
    formState: { isLoading },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: async () => {
      const data = await loadSettings();

      return { fonts: data.data?.websiteSettings.fonts ?? [] };
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'fonts' });

  const onSubmit = handleSubmit(data => {
    updateWebsiteSettings({ variables: { fonts: data.fonts } });
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
      <Link to="/settings/website">
        <Button
          size="small"
          variant="text"
          startIcon={<MdArrowBack />}
        >
          {t('websiteSettings.backToOverview')}
        </Button>
      </Link>

      <h3>{t('websiteSettings.fonts.title')}</h3>

      <Stack spacing={2}>
        {fields.map((field, index) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <Box flex={1}>
              <Controller
                name={`fonts.${index}`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FontPicker
                    {...field}
                    value={field.value.name}
                    error={error}
                  />
                )}
              />
            </Box>

            <IconButton
              onClick={() => remove(index)}
              size="small"
              color="error"
            >
              <MdDelete />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Box>
        <Button
          variant="text"
          size="small"
          startIcon={<MdAdd />}
          onClick={() => append({ name: '', weight: [], style: [] })}
        >
          {t('websiteSettings.fonts.addFont')}
        </Button>
      </Box>

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
