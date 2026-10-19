import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Autocomplete,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Switch,
  TextField,
} from '@mui/material';
import { ConsentsDocument, UserListDocument } from '@wepublish/editor/api';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export const userConsentSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  consentId: z.string().min(1),
  value: z.boolean(),
});

export type UserConsentFormValues = z.infer<typeof userConsentSchema>;

type UserConsentFormProps = {
  isEdit?: boolean;
};

const Fields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2.5)};
  width: 100%;
  max-width: 640px;
`;

export const UserConsentForm = ({ isEdit }: UserConsentFormProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext<UserConsentFormValues>();

  const { loading: loadingUsers, data: userData } = useQuery(UserListDocument, {
    variables: {
      take: 100,
    },
  });

  const { loading: loadingConsents, data: consentsData } =
    useQuery(ConsentsDocument);

  const consentsValues =
    consentsData?.consents?.map(consent => ({
      value: consent.id,
      label: consent.name,
    })) || [];

  const userValues =
    userData?.users?.nodes?.map(user => ({
      value: user.id,
      label: user.name,
    })) || [];

  if (loadingUsers || loadingConsents) {
    return <CircularProgress />;
  }

  return (
    <Fields>
      <Controller
        control={control}
        name="userId"
        render={({ field, fieldState: { error } }) => (
          <FormControl fullWidth>
            <FormLabel>{t('dashboard.user')}</FormLabel>
            <Autocomplete
              options={userValues}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, selected) =>
                option.value === selected.value
              }
              value={
                userValues.find(option => option.value === field.value) ?? null
              }
              onChange={(_event, option) => field.onChange(option?.value ?? '')}
              disabled={isEdit}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={t('dashboard.user')}
                  error={Boolean(error)}
                  helperText={error?.message}
                />
              )}
            />
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="consentId"
        render={({ field, fieldState: { error } }) => (
          <FormControl fullWidth>
            <FormLabel>{t('consents.consent')}</FormLabel>
            <Autocomplete
              options={consentsValues}
              getOptionLabel={option => option.label}
              isOptionEqualToValue={(option, selected) =>
                option.value === selected.value
              }
              value={
                consentsValues.find(option => option.value === field.value) ??
                null
              }
              onChange={(_event, option) => field.onChange(option?.value ?? '')}
              disabled={isEdit}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder={t('consents.consent')}
                  error={Boolean(error)}
                  helperText={error?.message}
                />
              )}
            />
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="value"
        render={({ field }) => (
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(field.value)}
                onChange={(_event, value) => field.onChange(value)}
              />
            }
            label={t('consents.accepted')}
          />
        )}
      />
    </Fields>
  );
};
