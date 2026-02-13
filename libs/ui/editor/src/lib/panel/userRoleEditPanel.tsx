import styled from '@emotion/styled';
import {
  FullUserRoleFragment,
  Permission,
  useCreateUserRoleMutation,
  usePermissionListQuery,
  useUpdateUserRoleMutation,
  useUserRoleQuery,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  CheckPicker,
  Drawer,
  Form as RForm,
  Message,
  Schema,
  toaster,
} from 'rsuite';

import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { toggleRequiredLabel } from '../toggleRequiredLabel';

const { Group, ControlLabel, Control } = RForm;

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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useUserRoleQuery({
    variables: { id: id! },
    fetchPolicy: 'network-only',
    skip: id === undefined,
  });

  const {
    data: permissionData,
    loading: isPermissionLoading,
    error: loadPermissionError,
  } = usePermissionListQuery({
    fetchPolicy: 'network-only',
  });

  const [createUserRole, { loading: isCreating, error: createError }] =
    useCreateUserRoleMutation();
  const [updateUserRole, { loading: isUpdating, error: updateError }] =
    useUpdateUserRoleMutation();

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
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
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
      fluid
      model={validationModel}
      formValue={{ name }}
    >
      <Drawer.Header>
        <Drawer.Title>
          {id ?
            t('userRoles.panels.editUserRole')
          : t('userRoles.panels.createUserRole')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_USER_ROLE']}>
            <Button
              type="submit"
              appearance="primary"
              disabled={isDisabled}
              data-testid="saveButton"
            >
              {id ? t('save') : t('create')}
            </Button>
          </PermissionControl>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('userRoles.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Group controlId="name">
          <ControlLabel>
            {toggleRequiredLabel(t('userRoles.panels.name'))}
          </ControlLabel>
          <Control
            name="name"
            value={name}
            disabled={isDisabled}
            onChange={(value: string) => setName(value)}
          />
        </Group>
        <Group controlId="description">
          <ControlLabel>{t('userRoles.panels.description')}</ControlLabel>
          <Control
            name={t('userRoles.panels.description')}
            value={description}
            disabled={isDisabled}
            onChange={(value: string) => setDescription(value)}
          />
        </Group>
        {systemRole && <p>{t('userRoles.panels.systemRole')}</p>}
        <Group controlId="permissions">
          <ControlLabel>{t('userRoles.panels.permissions')}</ControlLabel>
          <CheckPicker
            disabled={isDisabled}
            virtualized
            block
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
      </Drawer.Body>
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
