import styled from '@emotion/styled';
import {
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  FormLabel,
  Stack,
  TextField,
} from '@mui/material';
import {
  ColorPicker,
  InfoTooltip,
  RichTextBlock,
  RichTextBlockValue,
} from '@wepublish/ui/editor';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useWebsiteThemeColors } from '../website-settings/theme/theme-colors';

export type TagFormValues = {
  id?: string;
  tag?: string | null;
  color?: string | null;
  description?: RichTextBlockValue['richText'] | null;
  main?: boolean | null;
};

type TagFormProps<Values extends FieldValues> = {
  control: Control<Values>;
  disabled?: boolean;
};

const TagFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;
`;

export const TagForm = <Values extends TagFormValues & FieldValues>({
  control,
  disabled,
}: TagFormProps<Values>) => {
  const { t } = useTranslation();
  const themeColors = useWebsiteThemeColors();

  return (
    <TagFormWrapper>
      <Card>
        <CardContent>
          <Stack
            direction="column"
            spacing={3}
          >
            <Controller
              control={control}
              name={'tag' as Path<Values>}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('tags.overview.name')}
                  disabled={disabled}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              control={control}
              name={'color' as Path<Values>}
              render={({ field }) => (
                <div>
                  <FormLabel>
                    {t('tags.overview.color')}{' '}
                    <InfoTooltip text={t('tags.overview.colorInfo')} />
                  </FormLabel>

                  <ColorPicker
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                    presetColors={themeColors}
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name={'description' as Path<Values>}
              render={({ field }) => (
                <div>
                  <FormLabel>
                    {t('tags.overview.description')}{' '}
                    <InfoTooltip text={t('tags.overview.descriptionInfo')} />
                  </FormLabel>

                  <RichTextBlock
                    value={field.value}
                    onChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name={'main' as Path<Values>}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(field.value)}
                      onChange={(_event, checked) => field.onChange(checked)}
                      disabled={disabled}
                    />
                  }
                  label={
                    <>
                      {t('tags.overview.markAsMain')}{' '}
                      <InfoTooltip text={t('tags.overview.markAsMainInfo')} />
                    </>
                  }
                />
              )}
            />
          </Stack>
        </CardContent>
      </Card>
    </TagFormWrapper>
  );
};
