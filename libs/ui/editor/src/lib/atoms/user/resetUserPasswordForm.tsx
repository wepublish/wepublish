import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField } from '@mui/material';
import { ResetUserPasswordDocument } from '@wepublish/editor/api';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';

export interface ResetUserPasswordPanelProps {
  userID?: string;
  userName?: string;
  onClose(): void;
}

export function ResetUserPasswordForm({
  userID,
  userName,
  onClose,
}: ResetUserPasswordPanelProps) {
  const { t } = useTranslation();

  const [resetUserPassword, { loading: isUpdating, error: updateError }] =
    useMutation(ResetUserPasswordDocument);

  const schema = z.object({
    password: z
      .string()
      .min(1, t('errorMessages.noPasswordErrorMessage'))
      .min(12, t('errorMessages.passwordTooShortErrorMessage')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!userID) {
      return;
    }

    const { data } = await resetUserPassword({
      variables: { id: userID, password },
    });

    if (data?.resetPassword) {
      enqueueSnackbar('', {
        variant: 'success',
        title: t('userCreateOrEditView.passwordChangeSuccess'),
        autoHideDuration: 5000,
      });
      onClose();
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Stack
        direction="column"
        spacing={2}
      >
        <TextField
          {...register('password')}
          type="password"
          label={t('userCreateOrEditView.resetPasswordFor', { userName })}
          placeholder={t('userCreateOrEditView.password')}
          disabled={isUpdating}
          error={Boolean(errors.password || updateError)}
          helperText={
            errors.password?.message ??
            (updateError && humanizeError(updateError))
          }
          fullWidth
        />

        <Button
          variant="contained"
          type="submit"
          disabled={isUpdating}
          color="error"
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('userCreateOrEditView.resetPassword')}
        </Button>
      </Stack>
    </form>
  );
}
