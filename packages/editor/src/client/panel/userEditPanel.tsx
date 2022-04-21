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
  Modal,
  Panel,
  Schema,
  Toggle
} from 'rsuite'

import {
  useCreateUserMutation,
  FullUserFragment,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery,
  FullUserRoleFragment,
  useSendWebsiteLoginMutation
} from '../api'

import {ResetUserPasswordPanel} from './resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'
import {hasUncaughtExceptionCaptureCallback} from 'process'

export interface UserEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(user: FullUserFragment): void
}

export function UserEditPanel({id, onClose, onSave}: UserEditPanelProps) {
  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState<string | undefined>()
  const [preferredName, setPreferredName] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<Date | null>(null)
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([])
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])

  const [isResetUserPasswordOpen, setIsResetUserPasswordOpen] = useState(false)

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

  const [sendWebsiteLogin] = useSendWebsiteLoginMutation()

  const isDisabled =
    isLoading || isUserRoleLoading || isCreating || isUpdating || loadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name)
      setPreferredName(data.user.preferredName ?? undefined)
      setFirstName(data.user.firstName ?? undefined)
      setEmail(data.user.email)
      setEmailVerifiedAt(data.user.emailVerifiedAt ? new Date(data.user.emailVerifiedAt) : null)
      setActive(data.user.active)
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
            firstName,
            preferredName,
            email,
            emailVerifiedAt: emailVerifiedAt ? emailVerifiedAt.toISOString() : null,
            active,
            properties: data.user.properties.map(({value, key, public: publicValue}) => ({
              value,
              key,
              public: publicValue
            })),
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
            firstName,
            preferredName,
            email,
            emailVerifiedAt: null,
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

  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    firstName: StringType().isRequired('Please enter a firstname'),
    name: StringType().isRequired('Please enter a name'),
    email: StringType()
      .isRequired('Please enter a mail address')
      .isEmail('Please enter a valid email address'),
    password: StringType()
      .minLength(8, 'Password must be at least 8 characters long')
      .isRequired('Please provide a password')
  })

  const checkResult = validationModel.check({
    firstName: firstName,
    name: name,
    email: email,
    password: password
  })

  const [errorVisible, setErrorVisible] = useState({
    name: false,
    firstName: false,
    email: false,
    password: false
  })

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('userList.panels.editUser') : t('userList.panels.createUser')}
        </Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true} model={validationModel}>
            <FormGroup>
              <ControlLabel>{t('userList.panels.firstName') + '*'}</ControlLabel>
              <FormControl
                name={t('userList.panels.firstName')}
                value={firstName}
                disabled={isDisabled}
                onChange={value => {
                  setFirstName(value)
                  checkResult.firstName.hasError
                    ? setErrorVisible({...errorVisible, firstName: !firstName})
                    : ''
                }}
                errorMessage={errorVisible.firstName ? checkResult.firstName.errorMessage : ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userList.panels.name') + '*'}</ControlLabel>
              <FormControl
                name={t('userList.panels.name')}
                value={name}
                disabled={isDisabled}
                onChange={value => {
                  setName(value)
                  checkResult.name.hasError ? setErrorVisible({...errorVisible, name: !name}) : ''
                }}
                errorMessage={errorVisible.name ? checkResult.name.errorMessage : ''}
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
              <ControlLabel>{t('userList.panels.email') + '*'}</ControlLabel>
              <FormControl
                name={t('userList.panels.email')}
                value={email}
                disabled={isDisabled}
                onChange={value => {
                  setEmail(value)
                  checkResult.email.hasError
                    ? setErrorVisible({...errorVisible, email: true})
                    : setErrorVisible({...errorVisible, email: false})
                  console.log(
                    checkResult.email.hasError,
                    checkResult.email.errorMessage,
                    errorVisible.email
                  )
                }}
                errorMessage={errorVisible.email ? checkResult.email.errorMessage : ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>{t('userList.panels.active')}</ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
            </FormGroup>
            {!id ? (
              <FormGroup>
                <ControlLabel>{t('userList.panels.password') + '*'}</ControlLabel>
                <FormControl
                  type="password"
                  name={t('userList.panels.password')}
                  value={password}
                  disabled={isDisabled}
                  onChange={value => {
                    setPassword(value)
                    checkResult.password.hasError
                      ? setErrorVisible({...errorVisible, password: true})
                      : setErrorVisible({...errorVisible, password: false})
                  }}
                  errorMessage={errorVisible.password ? checkResult.password.errorMessage : ''}
                />
              </FormGroup>
            ) : (
              <FormGroup>
                <Button appearance="primary" onClick={() => setIsResetUserPasswordOpen(true)}>
                  {t('userList.panels.resetPassword')}
                </Button>
                <Button
                  appearance="primary"
                  style={{marginLeft: '20px'}}
                  disabled={!email || !active}
                  onClick={async () => {
                    try {
                      await sendWebsiteLogin({variables: {email}})
                      Alert.success(
                        t('userList.panels.sendWebsiteLoginSuccessMessage', {email}),
                        2000
                      )
                    } catch (error) {
                      Alert.error(t('userList.panel.sendWebsiteLoginFailureMessage', {error}), 0)
                    }
                  }}>
                  {t('userList.panels.sendWebsiteLogin')}
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
        </Panel>
      </Drawer.Body>

      <Drawer.Footer>
        <Button
          appearance={'primary'}
          disabled={
            isDisabled ||
            checkResult.email.hasError ||
            checkResult.firstName.hasError ||
            checkResult.name.hasError ||
            checkResult.name.hasError
          }
          onClick={() => handleSave()}>
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
    </>
  )
}
