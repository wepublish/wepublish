import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import {
  CreateUserRoleDocument,
  FullPermissionFragment,
  FullUserRoleFragment,
  PermissionListDocument,
  UpdateUserRoleDocument,
  UserRoleDocument,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckPicker, Form as RForm, Schema } from 'rsuite';

import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

const { Group, Label, Control } = RForm;

const Form = styled(RForm)`
  height: 100%;
`;

export interface UserRoleEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(userRole: FullUserRoleFragment): void;
}

function UserRoleEditPanel({ id, onClose, onSave }: UserRoleEditPanelProps) {
  const isAuthorized = useAuthorisation('CAN_CREATE_USER_ROLE');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemRole, setSystemRole] = useState(false);
  const [permissions, setPermissions] = useState<FullPermissionFragment[]>([]);
  const [allPermissions, setAllPermissions] = useState<
    FullPermissionFragment[]
  >([]);

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useQuery(UserRoleDocument, {
    variables: { id: id! },
    skip: id === undefined,
  });

  const {
    data: permissionData,
    loading: isPermissionLoading,
    error: loadPermissionError,
  } = useQuery(PermissionListDocument, {});

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

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.userRole) {
      setName(data.userRole.name);
      setDescription(data.userRole.description ?? '');
      setSystemRole(data.userRole.systemRole);
      setPermissions(data.userRole.permissions);
    }
  }, [data?.userRole]);

  useEffect(() => {
    if (permissionData?.permissions) {
      setAllPermissions(permissionData.permissions);
    }
  }, [permissionData?.permissions]);

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPermissionError?.message;
    if (error)
      enqueueSnackbar(error, { variant: 'error', autoHideDuration: null });
  }, [loadError, createError, updateError, loadPermissionError]);

  async function handleSave() {
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

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
  });

  return (
    <Form
      onSubmit={validationPassed => validationPassed && handleSave()}
      model={validationModel}
      formValue={{ name }}
    >
      <RForm.Stack fluid>
        <DrawerHeader>
          <DrawerTitle>
            {id ?
              t('userRoles.panels.editUserRole')
            : t('userRoles.panels.createUserRole')}
          </DrawerTitle>

          <DrawerActions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_USER_ROLE']}>
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
          <Group controlId="name">
            <Label>{toggleRequiredLabel(t('userRoles.panels.name'))}</Label>
            <Control
              name="name"
              value={name}
              disabled={isDisabled}
              onChange={(value: string) => setName(value)}
            />
          </Group>
          <Group controlId="description">
            <Label>{t('userRoles.panels.description')}</Label>
            <Control
              name={t('userRoles.panels.description')}
              value={description}
              disabled={isDisabled}
              onChange={(value: string) => setDescription(value)}
            />
          </Group>
          {systemRole && <p>{t('userRoles.panels.systemRole')}</p>}
          <Group controlId="permissions">
            <Label>{t('userRoles.panels.permissions')}</Label>
            <CheckPicker
              block
              disabled={isDisabled}
              virtualized
              disabledItemValues={
                systemRole ? allPermissions.map(per => per.id) : []
              }
              value={permissions.map(per => per.id)}
              data={allPermissions.map(permission => ({
                value: permission.id,
                label: permission.description,
              }))}
              onChange={value => {
                setPermissions(
                  allPermissions.filter(permissions =>
                    value.includes(permissions.id)
                  )
                );
              }}
            />
          </Group>
        </DrawerBody>
      </RForm.Stack>
    </Form>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_USER_ROLE',
  'CAN_GET_USER_ROLES',
  'CAN_CREATE_USER_ROLE',
  'CAN_DELETE_USER_ROLE',
])(UserRoleEditPanel);
export { CheckedPermissionComponent as UserRoleEditPanel };
