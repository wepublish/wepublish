import React, {useState, useEffect} from 'react'

import {toaster, Message, Button, CheckPicker, Drawer, Form, Schema} from 'rsuite'

import {
  Permission,
  useCreateUserRoleMutation,
  usePermissionListQuery,
  FullUserRoleFragment,
  useUpdateUserRoleMutation,
  useUserRoleQuery
} from '../api'

import {useTranslation} from 'react-i18next'
import {toggleRequiredLabel} from '../toggleRequiredLabel'

export interface UserRoleEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(userRole: FullUserRoleFragment): void
}

export function UserRoleEditPanel({id, onClose, onSave}: UserRoleEditPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemRole, setSystemRole] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])

  const {data, loading: isLoading, error: loadError} = useUserRoleQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {
    data: permissionData,
    loading: isPermissionLoading,
    error: loadPermissionError
  } = usePermissionListQuery({
    fetchPolicy: 'network-only'
  })

  const [createUserRole, {loading: isCreating, error: createError}] = useCreateUserRoleMutation()
  const [updateUserRole, {loading: isUpdating, error: updateError}] = useUpdateUserRoleMutation()

  const isDisabled =
    systemRole ||
    isLoading ||
    isPermissionLoading ||
    isCreating ||
    isUpdating ||
    loadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.userRole) {
      setName(data.userRole.name)
      setDescription(data.userRole.description ?? '')
      setSystemRole(data.userRole.systemRole)
      setPermissions(data.userRole.permissions)
    }
  }, [data?.userRole])

  useEffect(() => {
    if (permissionData?.permissions) {
      setAllPermissions(permissionData.permissions)
    }
  }, [permissionData?.permissions])

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadPermissionError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError, loadPermissionError])

  async function handleSave() {
    if (id) {
      const {data} = await updateUserRole({
        variables: {
          id,
          input: {
            name,
            description,
            permissionIDs: permissions.map(({id}) => id)
          }
        }
      })

      if (data?.updateUserRole) onSave?.(data.updateUserRole)
    } else {
      const {data} = await createUserRole({
        variables: {
          input: {
            name,
            description,
            permissionIDs: permissions.map(({id}) => id)
          }
        }
      })

      if (data?.createUserRole) onSave?.(data.createUserRole)
    }
  }

  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        style={{height: '100%'}}
        formValue={{name: name}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('userRoles.panels.editUserRole') : t('userRoles.panels.createUserRole')}
          </Drawer.Title>

          <Drawer.Actions>
            <Button
              type="submit"
              appearance="primary"
              disabled={isDisabled}
              data-testid="saveButton">
              {id ? t('userRoles.panels.save') : t('userRoles.panels.create')}
            </Button>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('userRoles.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <Form.Group controlId="name">
            <Form.ControlLabel>{toggleRequiredLabel(t('userRoles.panels.name'))}</Form.ControlLabel>
            <Form.Control
              name="name"
              value={name}
              disabled={isDisabled}
              onChange={(value: string) => setName(value)}
            />
          </Form.Group>
          <Form.Group controlId="description">
            <Form.ControlLabel>{t('userRoles.panels.description')}</Form.ControlLabel>
            <Form.Control
              name={t('userRoles.panels.description')}
              value={description}
              disabled={isDisabled}
              onChange={(value: string) => setDescription(value)}
            />
          </Form.Group>
          {systemRole && <p>{t('userRoles.panels.systemRole')}</p>}
          <Form.Group>
            <Form.ControlLabel>{t('userRoles.panels.permissions')}</Form.ControlLabel>
            <CheckPicker
              virtualized
              block
              disabledItemValues={systemRole ? allPermissions.map(per => per.id) : []}
              value={permissions.map(per => per.id)}
              data={allPermissions.map(permission => ({
                value: permission.id,
                label: permission.description
              }))}
              onChange={value => {
                // setPermissions(value)
                setPermissions(allPermissions.filter(permissions => value.includes(permissions.id)))
              }}
            />
          </Form.Group>
        </Drawer.Body>
      </Form>
    </>
  )
}
