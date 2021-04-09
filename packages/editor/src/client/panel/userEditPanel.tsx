import React, {useState, useEffect} from 'react'

import {
  Alert,
  Button,
  CheckPicker,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  HelpBlock,
  Modal,
  Toggle
} from 'rsuite'

import {DescriptionListItem, DescriptionList} from '../atoms/descriptionList'

import {
  useCreateUserMutation,
  FullUserFragment,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery,
  FullUserRoleFragment,
  FullUserSubscriptionFragment
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
  const [preferredName, setPreferredName] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)
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

  const isDisabled =
    isLoading || isUserRoleLoading || isCreating || isUpdating || loadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name)
      setPreferredName(data.user.preferredName ?? undefined)
      setEmail(data.user.email)
      setActive(data.user.active)
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
      loadUserRoleError?.message
    if (error) Alert.error(error, 0)
  }, [loadError, createError, updateError, loadUserRoleError])

  async function handleSave() {
    if (id && data?.user) {
      const {data: updateData} = await updateUser({
        variables: {
          id,
          input: {
            name,
            preferredName,
            email,
            active,
            properties: data.user.properties,
            roleIDs: roles.map(role => role.id)
          }
        }
      })

      if (updateData?.updateUser) onSave?.(updateData.updateUser)
    } else {
      const {data: createData} = await createUser({
        variables: {
          input: {
            name,
            preferredName,
            email,
            active,
            properties: [],
            roleIDs: roles.map(role => role.id)
          },
          password
        }
      })
      if (createData?.createUser) onSave?.(createData.createUser)
    }
  }

  return (
    <>
      <Modal.Header>
        <Modal.Title>
          {id ? t('userList.panels.editUser') : t('userList.panels.createUser')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form fluid>
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
            <ControlLabel>{t('userList.panels.preferredName')}</ControlLabel>
            <FormControl
              name={t('userList.panels.preferredName')}
              value={preferredName}
              disabled={isDisabled}
              onChange={value => setPreferredName(value)}
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
          <FormGroup>
            <ControlLabel>{t('userList.panels.active')}</ControlLabel>
            <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
          </FormGroup>
        </Form>
        <h5 className="wep-section-title">{t('userList.panels.subTitle')}</h5>

        {subscription && (
          <DescriptionList>
            <DescriptionListItem label={t('userList.panels.startedAt')}>
              {new Date(subscription.startsAt).toLocaleString()}
            </DescriptionListItem>
            <DescriptionListItem label={t('userList.panels.payedUntil')}>
              {subscription.paidUntil ? new Date(subscription.paidUntil).toLocaleString() : ''}
            </DescriptionListItem>
            <DescriptionListItem label={t('userList.panels.memberPlan')}>
              {subscription.memberPlan.name}
            </DescriptionListItem>
          </DescriptionList>
        )}
        <Button
          disabled={isDisabled || id === undefined}
          appearance="ghost"
          color="green"
          onClick={() => setIsUserSubscriptonEditOpen(true)}>
          {t(subscription ? 'userList.panels.subEdit' : 'userList.panels.subCreate')}
        </Button>
        {id === undefined && <HelpBlock>{t('userList.panels.subDisableDescription')}</HelpBlock>}
      </Modal.Body>

      <Modal.Footer classPrefix="wep-modal-footer">
        <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
          {id ? t('userList.panels.save') : t('userList.panels.create')}
        </Button>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('userList.panels.cancel')}
        </Button>
      </Modal.Footer>

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

        <Modal.Footer classPrefix="wep-modal-footer">
          <Button onClick={() => setIsResetUserPasswordOpen(false)} appearance="subtle">
            {t('userList.panels.cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      {id !== undefined && (
        <Modal
          show={isUserSubscriptonEditOpen}
          size={'sm'}
          onHide={() => setIsUserSubscriptonEditOpen(false)}>
          <UserSubscriptionEditPanel
            userID={id}
            subscription={subscription}
            onClose={() => setIsUserSubscriptonEditOpen(false)}
            onSave={value => {
              setIsUserSubscriptonEditOpen(false)
              setUserSubscription(value)
            }}
          />
        </Modal>
      )}
    </>
  )
}
