import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  type FullUserFragment,
  ResetUserTotpDocument,
  UpdateUserDocument,
  UserDocument,
} from '@wepublish/editor/api';
import {
  CanResetUserPassword,
  CanResetUserTotp,
} from '@wepublish/permissions';
import {
  EditUserPassword,
  enqueueSnackbar,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdLockReset } from 'react-icons/md';
import { useParams } from 'react-router-dom';

type UserTotpProps = {
  user: FullUserFragment;
};

const totpStatusKey = ({ totpEnabled, totpExempt }: FullUserFragment) =>
  totpEnabled ? 'userCreateOrEditView.totpEnabled'
  : totpExempt ? 'userCreateOrEditView.totpExemptInfo'
  : 'userCreateOrEditView.totpDisabled';

function UserTotp({ user }: UserTotpProps) {
  const { t } = useTranslation();
  const [resetUserTotp, { loading: resetting }] = useMutation(
    ResetUserTotpDocument
  );
  const [updateUser, { loading: updating }] = useMutation(UpdateUserDocument);

  const resetTotp = async () => {
    try {
      await resetUserTotp({ variables: { userId: user.id } });
      enqueueSnackbar(t('userList.overview.totpResetSuccess'), {
        variant: 'success',
        autoHideDuration: 2000,
      });
    } catch {
      enqueueSnackbar(t('userList.overview.totpResetError'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  const changeExempt = async (totpExempt: boolean) => {
    if (
      totpExempt &&
      !window.confirm(t('userCreateOrEditView.totpExemptWarning'))
    ) {
      return;
    }

    try {
      await updateUser({
        variables: {
          id: user.id,
          name: user.name,
          email: user.email,
          totpExempt,
        },
      });
      enqueueSnackbar(t('userCreateOrEditView.successfullyUpdatedUser'), {
        variant: 'success',
        autoHideDuration: 2000,
      });
    } catch (error) {
      enqueueSnackbar(t('userCreateOrEditView.errorOnUpdate', { error }), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <Stack
      spacing={1.5}
      sx={{ alignItems: 'flex-start' }}
    >
      <Typography
        variant="subtitle2"
        component="h3"
      >
        {t('userCreateOrEditView.totpHeader')}
      </Typography>
      <Typography variant="body2">{t(totpStatusKey(user))}</Typography>
      <Button
        variant="contained"
        color="warning"
        startIcon={<MdLockReset />}
        disabled={!user.totpEnabled || resetting}
        onClick={resetTotp}
      >
        {t('userList.overview.resetTotp')}
      </Button>
      <FormControlLabel
        control={
          <Switch
            checked={user.totpExempt}
            disabled={updating}
            onChange={(_event, value) => changeExempt(value)}
          />
        }
        label={t('userCreateOrEditView.totpExemptLabel')}
      />
    </Stack>
  );
}

export function UserAccessActions() {
  const { id = '' } = useParams();
  const canResetPassword = useAuthorisation(CanResetUserPassword.id) === true;
  const canResetTotp = useAuthorisation(CanResetUserTotp.id) === true;
  const { data } = useQuery(UserDocument, { variables: { id } });
  const user = data?.user;

  if (user === undefined || user === null) {
    return null;
  }

  return (
    <Stack spacing={3}>
      <EditUserPassword
        user={user}
        isDisabled={!canResetPassword}
      />
      {canResetTotp ?
        <UserTotp user={user} />
      : null}
    </Stack>
  );
}
