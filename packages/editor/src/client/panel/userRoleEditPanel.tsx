import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  PanelSectionHeader,
  Toast,
  Checkbox,
  Toggle
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {
  Permission,
  useCreateUserRoleMutation,
  UserRole,
  useUpdateUserRoleMutation,
  useUserRoleQuery
} from '../api/userRole'

export interface UserRoleEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(userRole: UserRole): void
}

export function UserRoleEditPanel({id, onClose, onSave}: UserRoleEditPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemRole, setSystemRole] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const {data, loading: isLoading, error: loadError} = useUserRoleQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id == undefined
  })

  const [createUserRole, {loading: isCreating, error: createError}] = useCreateUserRoleMutation()
  const [updateUserRole, {loading: isUpdating, error: updateError}] = useUpdateUserRoleMutation()

  const isDisabled = systemRole || isLoading || isCreating || isUpdating || loadError != undefined

  useEffect(() => {
    if (data?.userRole) {
      setName(data.userRole.name)
      setDescription(data.userRole.description)
      setSystemRole(data.userRole.systemRole)
      setPermissions(data.userRole.permissions)
    }
  }, [data?.userRole])

  useEffect(() => {
    if (loadError) {
      setErrorToastOpen(true)
      setErrorMessage(loadError.message)
    } else if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    } else if (updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError.message)
    }
  }, [loadError, createError, updateError])

  async function handleSave() {
    if (id) {
      const {data} = await updateUserRole({
        variables: {
          id,
          input: {
            name,
            description,
            permissions: permissions.filter(permission => permission.checked).map(({id}) => id)
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
            permissions: permissions.filter(permission => permission.checked).map(({id}) => id)
          }
        }
      })

      if (data?.createUserRole) onSave?.(data.createUserRole)
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={id ? 'Edit UserRole' : 'Create UserRole'}
          leftChildren={
            <NavigationButton icon={MaterialIconClose} label="Close" onClick={() => onClose?.()} />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={id ? 'Save' : 'Create'}
              disabled={isDisabled}
              onClick={handleSave}
            />
          }
        />

        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Name"
              value={name}
              disabled={isDisabled}
              onChange={e => {
                setName(e.target.value)
              }}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Description"
              value={description}
              disabled={isDisabled}
              onChange={e => {
                setDescription(e.target.value)
              }}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <Checkbox
              label="System Role"
              checked={systemRole}
              disabled={true}
              onChange={e => e.preventDefault()}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Permissions" />
        <PanelSection>
          {permissions.map(permission => {
            return (
              <Toggle
                key={permission.id}
                label={permission.id}
                description={permission.description}
                disabled={isDisabled}
                checked={permission.checked}
                onChange={e => {
                  setPermissions(
                    permissions.map(per => {
                      if (per.id === permission.id) {
                        return {
                          ...permission,
                          checked: e.target.checked
                        }
                      }
                      return per
                    })
                  )
                }}
              />
            )
          })}
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
