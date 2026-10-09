import { useMutation } from '@apollo/client/react';
import { Button } from '@mui/material';
import { ResetUserPasswordDocument } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Schema } from 'rsuite';

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
  const [password, setPassword] = useState('');

  const [resetUserPassword, { loading: isUpdating, error: updateError }] =
    useMutation(ResetUserPasswordDocument);

  const isDisabled = isUpdating;

  const { t } = useTranslation();

  // Schema used for form validation
  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    password: StringType()
      .isRequired(t('errorMessages.noPasswordErrorMessage'))
      .minLength(12, t('errorMessages.passwordTooShortErrorMessage')),
  });

  return (
    <Form
      fluid
      model={validationModel}
      onSubmit={async (validationPassed, e) => {
        e?.preventDefault();
        if (!userID || !password) {
          return;
        }
        const { data } = await resetUserPassword({
          variables: {
            id: userID,
            password,
          },
        });
        if (data?.resetPassword) {
          enqueueSnackbar('', {
            variant: 'success',
            title: t('userCreateOrEditView.passwordChangeSuccess'),
            autoHideDuration: 5000,
          });
          onClose();
        }
      }}
    >
      <Form.Group controlId="password">
        <Form.Label>
          {t('userCreateOrEditView.resetPasswordFor', { userName })}
        </Form.Label>
        <Form.Control
          name="password"
          disabled={isDisabled}
          type="password"
          placeholder={t('userCreateOrEditView.password')}
          errorMessage={updateError && humanizeError(updateError)}
          value={password}
          onChange={(value: string) => setPassword(value)}
        />
      </Form.Group>

      <Button
        variant="contained"
        type="submit"
        disabled={isDisabled}
        color="error"
      >
        {t('userCreateOrEditView.resetPassword')}
      </Button>
    </Form>
  );
}
