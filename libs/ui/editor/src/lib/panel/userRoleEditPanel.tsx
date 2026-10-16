import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreateUserRoleDocument,
  FullPermissionFragment,
  FullUserRoleFragment,
  PermissionListDocument,
  UpdateUserRoleDocument,
  UserRoleDocument,
} from '@wepublish/editor/api';
import {
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetUserRole,
  CanGetUserRoles,
} from '@wepublish/permissions';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import {
  DrawerActions,
  DrawerBody,
  DrawerForm,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

const EMPTY_USER_ROLE = {
  name: '',
  description: '',
  systemRole: false,
  permissions: [] as FullPermissionFragment[],
};

const toFormValues = (
  userRole: FullUserRoleFragment
): typeof EMPTY_USER_ROLE => ({
  name: userRole.name,
  description: userRole.description ?? '',
  systemRole: userRole.systemRole,
  permissions: userRole.permissions,
});

export interface UserRoleEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(userRole: FullUserRoleFragment): void;
}

function UserRoleEditPanel({ id, onClose, onSave }: UserRoleEditPanelProps) {
  const { t } = useTranslation();
  const isAuthorized = useAuthorisation(CanCreateUserRole.id);
  const client = useApolloClient();
  const [loadError, setLoadError] = useState<Error>();

  const schema = z.object({
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    description: z.string(),
    systemRole: z.boolean(),
    permissions: z.array(z.custom<FullPermissionFragment>()),
  });

  const {
    control,
    handleSubmit,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (!id) {
        return EMPTY_USER_ROLE;
      }

      try {
        const { data } = await client.query({
          query: UserRoleDocument,
          variables: { id },
        });

        return data?.userRole ? toFormValues(data.userRole) : EMPTY_USER_ROLE;
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_USER_ROLE;
      }
    },
  });

  const systemRole = useWatch({ control, name: 'systemRole' });

  const {
    data: permissionData,
    loading: isPermissionLoading,
    error: loadPermissionError,
  } = useQuery(PermissionListDocument, {});

  const allPermissions = permissionData?.permissions ?? [];

  const [createUserRole, { loading: isCreating, error: createError }] =
    useMutation(CreateUserRoleDocument);
  const [updateUserRole, { loading: isUpdating, error: updateError }] =
    useMutation(UpdateUserRoleDocument);

  const isDisabled =
    systemRole ||
    isLoading ||
    isPermissionLoading ||
    isCreating ||
    isUpdating ||
    loadError !== undefined ||
    !isAuthorized;

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPermissionError?.message;
    if (error) {
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
    }
  }, [loadError, createError, updateError, loadPermissionError]);

  async function handleSave({
    name,
    description,
    permissions,
  }: z.infer<typeof schema>) {
    if (id) {
      const { data } = await updateUserRole({
        variables: {
          id,
          name,
          description,
          permissionIDs: permissions.map(({ id }) => id),
        },
      });

      if (data?.updateUserRole) {
        onSave?.(data.updateUserRole);
      }
    } else {
      const { data } = await createUserRole({
        variables: {
          name,
          description,
          permissionIDs: permissions.map(({ id }) => id),
        },
      });

      if (data?.createUserRole) {
        onSave?.(data.createUserRole);
      }
    }
  }

  return (
    <DrawerForm onSubmit={handleSubmit(handleSave)}>
      <Stack
        direction="column"
        sx={{ height: '100%' }}
      >
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('userRoles.panels.editUserRole')
            : t('userRoles.panels.createUserRole')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={[CanCreateUserRole.id]}>
              <Button
                variant="contained"
                type="submit"
                disabled={isDisabled}
                data-testid="saveButton"
              >
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button
              variant="text"
              onClick={() => onClose?.()}
            >
              {t('userRoles.panels.close')}
            </Button>
          </DrawerActions>
        </DrawerHeader>

        <DrawerBody>
          {!isLoading && (
            <>
              <Stack
                direction="column"
                spacing={3}
              >
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={toggleRequiredLabel(t('userRoles.panels.name'))}
                      disabled={isDisabled}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="description"
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label={t('userRoles.panels.description')}
                      disabled={isDisabled}
                      error={Boolean(error)}
                      helperText={error?.message}
                      fullWidth
                    />
                  )}
                />

                {systemRole && (
                  <Typography>{t('userRoles.panels.systemRole')}</Typography>
                )}

                <Controller
                  control={control}
                  name="permissions"
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      disabled={isDisabled || systemRole}
                      options={allPermissions}
                      value={field.value}
                      getOptionLabel={permission => permission.description}
                      isOptionEqualToValue={(option, selected) =>
                        option.id === selected.id
                      }
                      onChange={(_event, selected) => field.onChange(selected)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label={t('userRoles.panels.permissions')}
                        />
                      )}
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </>
          )}
        </DrawerBody>
      </Stack>
    </DrawerForm>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetUserRole.id,
  CanGetUserRoles.id,
  CanCreateUserRole.id,
  CanDeleteUserRole.id,
])(UserRoleEditPanel);
export { CheckedPermissionComponent as UserRoleEditPanel };
