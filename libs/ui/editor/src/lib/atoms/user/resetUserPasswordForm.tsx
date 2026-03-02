import { useResetUserPasswordMutation } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, Notification, Schema, toaster } from 'rsuite';

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
  const [sendMail, setSendMail] = useState<boolean>(false);

  const [resetUserPassword, { loading: isUpdating, error: updateError }] =
    useResetUserPasswordMutation();

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
        e.preventDefault();
        if (!userID || !password) {
          return;
        }
        const { data } = await resetUserPassword({
          variables: {
            id: userID,
            password,
            sendMail,
          },
        });
        if (data?.resetPassword) {
          toaster.push(
            <Notification
              type="success"
              header={t('userCreateOrEditView.passwordChangeSuccess')}
              duration={5000}
            />,
            { placement: 'topEnd' }
          );
          onClose();
        }
      }}
    >
      <Form.Group controlId="password">
        <Form.ControlLabel>
          {t('userCreateOrEditView.resetPasswordFor', { userName })}
        </Form.ControlLabel>
        <Form.Control
          name="password"
          disabled={isDisabled}
          type="password"
          placeholder={t('userCreateOrEditView.password')}
          errorMessage={updateError?.message}
          value={password}
          onChange={(value: string) => setPassword(value)}
        />

        <Checkbox
          style={{ marginTop: '8px' }}
          checked={sendMail}
          onChange={(value, checked) => setSendMail(checked)}
        >
          {t('resetUserPasswordForm.sendMail')}
        </Checkbox>
      </Form.Group>

      <Button
        type="submit"
        disabled={isDisabled}
        appearance="primary"
        color="red"
      >
        {t('userCreateOrEditView.resetPassword')}
      </Button>
    </Form>
  );
}
