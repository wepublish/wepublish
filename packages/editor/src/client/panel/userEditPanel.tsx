import React, {useState, useEffect} from 'react'

import {
  Alert,
  Button,
  CheckPicker,
  ControlLabel,
  Drawer,
  Form,
  FormControl,
  FormGroup,
  Modal
} from 'rsuite'

import {DescriptionListItem, DescriptionList} from '../atoms/descriptionList'

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

import {useTranslation} from 'react-i18next'

export interface UserEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(user: FullUserFragment): void
}

export function UserEditPanel({id, onClose, onSave}: UserEditPanelProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([])
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const [subscription, setUserSubscription] = useState<FullUserSubscriptionFragment>()

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)
  const [isUserSubscriptonEditOpen, setIsUserSubscriptonEditOpen] = useState(false)

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

  const {t} = useTranslation()

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
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      loadUserRoleError?.message ??
      deleteSubscriptionError?.message
    if (error) Alert.error(error, 0)
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

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('userList.panels.editUser') : t('userList.panels.createUser')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Form fluid={true}>
          <FormGroup>
            <ControlLabel>{t('userList.panels.name')}</ControlLabel>
            <FormControl
              name={t('userList.panels.name')}
              value={name}
              disabled={isDisabled}
              onChange={value => setName(value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>{t('userList.panels.email')}</ControlLabel>
            <FormControl
              name={t('userList.panels.email')}
              value={email}
              disabled={isDisabled}
              onChange={value => setEmail(value)}
            />
          </FormGroup>
          {!id ? (
            <FormGroup>
              <ControlLabel>{t('userList.panels.password')}</ControlLabel>
              <FormControl
                type="password"
                name={t('userList.panels.password')}
                value={password}
                disabled={isDisabled}
                onChange={value => setPassword(value)}
              />
            </FormGroup>
          ) : (
            <FormGroup>
              <Button appearance="primary" onClick={() => setIsResetUserPasswordOpen(true)}>
                {t('userList.panels.resetPassword')}
              </Button>
            </FormGroup>
          )}
          <FormGroup>
            <ControlLabel>{t('userList.panels.userRoles')}</ControlLabel>
            <CheckPicker
              name={t('userList.panels.userRoles')}
              block={true}
              value={roles.map(role => role.id)}
              data={userRoles.map(userRole => ({value: userRole.id, label: userRole.name}))}
              onChange={value => {
                setRoles(userRoles.filter(userRole => value.includes(userRole.id)))
              }}
            />
          </FormGroup>
        </Form>
        {subscription && (
          <Panel>
            <DescriptionList>
              <DescriptionListItem label="Started">
                {new Date(subscription.startsAt).toLocaleString()}
              </DescriptionListItem>
              <DescriptionListItem label="Payed Until">
                {new Date(subscription.payedUntil).toLocaleString()}
              </DescriptionListItem>
              <DescriptionListItem label="Member Plan">
                {subscription.memberPlan.name}
              </DescriptionListItem>
            </DescriptionList>
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
            {id === undefined && (
              <div>
                <Typography variant="body1">
                  Subscription can only be added once the user has been created.
                </Typography>
              </div>
            )}
          </Panel>
        )}
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {id ? t('userList.panels.save') : t('userList.panels.create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('userList.panels.close')}
        </Button>
      </Drawer.Footer>

      <Modal show={isResetUserPasswordOpen} onHide={() => setIsResetUserPasswordOpen(false)}>
        <Modal.Header>
          <Modal.Title>{t('userList.panels.resetPassword')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ResetUserPasswordPanel
            userID={id}
            userName={name}
            onClose={() => setIsResetUserPasswordOpen(false)}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
            {t('userList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {id !== undefined && (
        <Drawer
          show={isUserSubscriptonEditOpen}
          size={'sm'}
          onHide={() => setIsUserSubscriptonEditOpen(false)}>
          <UserSubscriptionEditPanel
            userId={id}
            subscription={subscription}
            onClose={() => setIsUserSubscriptonEditOpen(false)}
            onSave={value => {
              setIsUserSubscriptonEditOpen(false)
              setUserSubscription(value)
            }}
          />
        </Drawer>
      )}
    </>
  )
}
