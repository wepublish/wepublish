import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  Toast,
  PanelSectionHeader,
  Typography,
  OptionButton,
  IconButton,
  Select
} from '@karma.run/ui'

import {
  MaterialIconAdd,
  MaterialIconClose,
  MaterialIconRemoveOutlined,
  MaterialIconSaveOutlined
} from '@karma.run/icons'

import {useCreateUserMutation, User, useUpdateUserMutation, useUserQuery} from '../api/user'
import {useListUserRolesQuery, UserRole} from '../api/userRole'

export interface UserEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(user: User): void
}

enum ConfirmAction {
  Remove = 'remove',
  Add = 'add'
}

export function UserEditPanel({id, onClose, onSave}: UserEditPanelProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<UserRole[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>()

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const {data, loading: isLoading, error: loadError} = useUserQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id == undefined
  })

  const {
    data: userRoleData,
    loading: isUserRoleLoading,
    error: loadUserRoleError
  } = useListUserRolesQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200 // TODO: Pagination
    }
  })

  const [createUser, {loading: isCreating, error: createError}] = useCreateUserMutation()
  const [updateUser, {loading: isUpdating, error: updateError}] = useUpdateUserMutation()

  const isDisabled =
    isLoading || isUserRoleLoading || isCreating || isUpdating || loadError != undefined

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name)
      setEmail(data.user.email)
      setRoles(data.user.roles)
      setPassword('***') //TODO: handle password
    }
  }, [data?.user])

  useEffect(() => {
    if (userRoleData?.userRoles?.nodes) {
      setUserRoles(userRoleData.userRoles.nodes)
    }
  }, [userRoleData?.userRoles])

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
    } else if (loadUserRoleError) {
      setErrorToastOpen(true)
      setErrorMessage(loadUserRoleError.message)
    }
  }, [loadError, createError, updateError, loadUserRoleError])

  async function handleSave() {
    if (id) {
      const {data} = await updateUser({
        variables: {
          id,
          input: {
            name,
            email,
            roleIDs: roles.map(role => role.id)
          }
        }
      })

      if (data?.updateUser) onSave?.(data.updateUser)
    } else {
      const {data} = await createUser({
        variables: {
          input: {
            name,
            email,
            roleIDs: roles.map(role => role.id)
          }
        }
      })
      if (data?.createUser) onSave?.(data.createUser)
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={id ? 'Edit User' : 'Create User'}
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
              label="Email"
              value={email}
              disabled={isDisabled}
              onChange={e => {
                setEmail(e.target.value)
              }}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label="Password"
              value={password}
              disabled={isDisabled}
              onChange={e => {
                setPassword(e.target.value)
              }}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title="User Roles" />
        <PanelSection>
          {roles.map(role => {
            return (
              <Box key={role.id} display="flex" flexDirection="row" alignItems="center">
                <Box>
                  <Typography variant="h3">{role.name}</Typography>
                  <Typography variant="body1">{role.description}</Typography>
                </Box>
                <Box flexGrow={1} />
                <OptionButton
                  position="left"
                  menuItems={[
                    {id: ConfirmAction.Remove, label: 'Remove', icon: MaterialIconRemoveOutlined}
                  ]}
                  onMenuItemClick={item => {
                    setRoles(roles.filter(_role => _role.id !== role.id))
                  }}
                />
              </Box>
            )
          })}
          <Box marginTop={Spacing.Large}>
            <Typography variant="h3">Add User Role</Typography>
          </Box>
          <Box display="flex" flexDirection="row" alignItems="center">
            <Select
              description="Select User Role"
              flexBasis="90%"
              options={userRoles}
              value={currentUserRole}
              renderListItem={userRole => userRole?.name}
              onChange={userRole => setCurrentUserRole(userRole)}
            />
            <IconButton
              flexBasis="10%"
              icon={MaterialIconAdd}
              margin={Spacing.Tiny}
              variant="large"
              onClick={() => {
                if (!currentUserRole) return
                setRoles([...roles, currentUserRole])
                setCurrentUserRole(undefined)
              }}
            />
          </Box>
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
