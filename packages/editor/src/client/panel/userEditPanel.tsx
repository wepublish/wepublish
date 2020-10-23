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
  Select,
  Button,
  Dialog,
  Drawer,
  DescriptionListItem,
  DescriptionList
} from '@karma.run/ui'

import {
  MaterialIconAdd,
  MaterialIconClose,
  MaterialIconRemoveOutlined,
  MaterialIconSaveOutlined
} from '@karma.run/icons'

import {
  useCreateUserMutation,
  FullUserFragment,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery,
  FullUserRoleFragment,
  FullUserSubscriptionFragment,
  useDeleteUserSubscriptionMutation
} from '../api'

import {ResetUserPasswordPanel} from './resetUserPasswordPanel'
import {UserSubscriptionEditPanel} from './userSubscriptionEditPanel'

export interface UserEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(user: FullUserFragment): void
}

enum ConfirmAction {
  Remove = 'remove',
  Add = 'add'
}

export function UserEditPanel({id, onClose, onSave}: UserEditPanelProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([])
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const [subscription, setUserSubscription] = useState<FullUserSubscriptionFragment>()

  const [currentUserRole, setCurrentUserRole] = useState<FullUserRoleFragment>()

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)
  const [isUserSubscriptonEditOpen, setIsUserSubscriptonEditOpen] = useState(false)

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const {data, loading: isLoading, error: loadError} = useUserQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {
    data: userRoleData,
    loading: isUserRoleLoading,
    error: loadUserRoleError
  } = useUserRoleListQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200 // TODO: Pagination
    }
  })

  const [createUser, {loading: isCreating, error: createError}] = useCreateUserMutation()
  const [updateUser, {loading: isUpdating, error: updateError}] = useUpdateUserMutation()

  const [
    deleteSubscription,
    {loading: isDeleteingSubscription, error: deleteSubscriptionError}
  ] = useDeleteUserSubscriptionMutation()

  const isDisabled =
    isLoading ||
    isUserRoleLoading ||
    isCreating ||
    isUpdating ||
    isDeleteingSubscription ||
    loadError !== undefined ||
    deleteSubscriptionError !== undefined

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name)
      setEmail(data.user.email)
      setUserSubscription(data.user.subscription ?? undefined)
      if (data.user.roles) {
        // TODO: fix this
        setRoles(data.user.roles as FullUserRoleFragment[])
      }
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
    } else if (deleteSubscriptionError) {
      setErrorToastOpen(true)
      setErrorMessage(deleteSubscriptionError.message)
    }
  }, [loadError, createError, updateError, loadUserRoleError, deleteSubscriptionError])

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
          },
          password
        }
      })
      if (data?.createUser) onSave?.(data.createUser)
    }
  }

  function handleSetCurrentUserRole(userRole: FullUserRoleFragment | undefined): void {
    if (!userRole) return
    setCurrentUserRole(userRole)
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
            {!id && (
              <TextInput
                label="Password"
                type="password"
                value={password}
                disabled={isDisabled}
                onChange={e => {
                  setPassword(e.target.value)
                }}
              />
            )}
            {id && (
              <Button
                label="Reset Password"
                variant="outlined"
                onClick={() => setIsResetUserPasswordOpen(true)}
              />
            )}
          </Box>
        </PanelSection>
        <PanelSectionHeader title="Subscription" />
        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            {subscription && (
              <Box marginBottom={Spacing.ExtraSmall}>
                <DescriptionList>
                  <DescriptionListItem label="Started">
                    {new Date(subscription.startsAt).toLocaleString()}
                  </DescriptionListItem>
                  <DescriptionListItem label="Payed Until">
                    {new Date(subscription.payedUntil).toLocaleString()}
                  </DescriptionListItem>
                  <DescriptionListItem label="Member Plan">
                    {subscription.memberPlan.label}
                  </DescriptionListItem>
                </DescriptionList>
              </Box>
            )}
            <Box display="flex" width="100%">
              <Button
                marginRight={Spacing.ExtraSmall}
                disabled={isDisabled || id === undefined}
                label={subscription ? `Edit` : 'Create'}
                variant="outlined"
                onClick={() => setIsUserSubscriptonEditOpen(true)}
              />
              {subscription && id && (
                <Button
                  label="Delete"
                  disabled={isDisabled || id === undefined}
                  variant="outlined"
                  onClick={async () => {
                    const result = await deleteSubscription({
                      variables: {
                        userId: id
                      }
                    })
                    if (result?.data?.deleteUserSubscription === id) {
                      setUserSubscription(undefined)
                    }
                  }}
                />
              )}
            </Box>
          </Box>
          {id === undefined && (
            <Box marginBottom={Spacing.ExtraSmall}>
              <Typography variant="body1">
                Subscription can only be added once the user has been created.
              </Typography>
            </Box>
          )}
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
              onChange={userRole => handleSetCurrentUserRole(userRole)}
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
      <Dialog
        open={isResetUserPasswordOpen}
        onClose={() => setIsResetUserPasswordOpen(false)}
        width={480}
        closeOnBackgroundClick>
        {() => (
          <ResetUserPasswordPanel
            userID={id}
            userName={name}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        )}
      </Dialog>
      {id !== undefined && (
        <Drawer open={isUserSubscriptonEditOpen} width={480}>
          {() => (
            <UserSubscriptionEditPanel
              userId={id}
              subscription={subscription}
              onClose={() => setIsUserSubscriptonEditOpen(false)}
              onSave={value => {
                setIsUserSubscriptonEditOpen(false)
                setUserSubscription(value)
              }}
            />
          )}
        </Drawer>
      )}
    </>
  )
}
