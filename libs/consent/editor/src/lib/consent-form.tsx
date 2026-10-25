import styled from '@emotion/styled';
import {
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
} from '@mui/material';
import { InfoTooltip } from '@wepublish/ui/editor';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const consentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  defaultValue: z.boolean(),
});

export type ConsentFormValues = z.infer<typeof consentSchema>;

type ConsentFormProps = {
  create?: boolean;
};

const Fields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2.5)};
  width: 100%;
  max-width: 640px;
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

export const ConsentForm = ({ create }: ConsentFormProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<ConsentFormValues>();

  return (
    <Fields>
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            label={t('consents.name')}
            error={Boolean(error)}
            helperText={error?.message}
            fullWidth
          />
        )}
      />

      <Controller
        control={control}
        name="slug"
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            value={field.value ?? ''}
            label={t('consents.slug')}
            error={Boolean(error)}
            helperText={error?.message}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <InfoTooltip text={t('consents.slugInfo')} />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
      />

      <Controller
        control={control}
        name="defaultValue"
        render={({ field }) => (
          <SwitchRow>
            <FormControlLabel
              sx={{ marginRight: 0 }}
              control={
                <Switch
                  checked={Boolean(field.value)}
                  onChange={(_event, defaultValue) =>
                    field.onChange(defaultValue)
                  }
                />
              }
              label={t('consents.checkedByDefault')}
            />
            <InfoTooltip text={t('consents.defaultValueInfo')} />
          </SwitchRow>
        )}
      />
    </Fields>
  );
};
