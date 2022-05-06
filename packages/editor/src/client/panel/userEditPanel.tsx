import React, {useState, useEffect} from 'react'

import {toaster, Message, Button, CheckPicker, Drawer, Form, Modal, Panel, Toggle} from 'rsuite'

import {
  useCreateUserMutation,
  FullUserFragment,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery,
  FullUserRoleFragment,
  useSendWebsiteLoginMutation,
  UserAddress
} from '../api'

import {ResetUserPasswordPanel} from './resetUserPasswordPanel'

import {useTranslation} from 'react-i18next'

export interface UserEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(user: FullUserFragment): void
}

/**
 * Function to update address object
 * @param address
 * @param setAddress
 * @param key
 * @param value
 */

function updateAddressObject(
  address: UserAddress | null,
  setAddress: React.Dispatch<React.SetStateAction<UserAddress | null>>,
  key: 'company' | 'streetAddress' | 'streetAddress2' | 'zipCode' | 'city' | 'country',
  value: string | null
) {
  let addressCopy = Object.assign({}, address)
  if (!address) {
    addressCopy = {
      company: '',
      streetAddress: '',
      streetAddress2: '',
      zipCode: '',
      city: '',
      country: ''
    }
  }
  addressCopy[key] = value || ''
  setAddress(addressCopy)
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
  const [address, setAddress] = useState<UserAddress | null>(null)

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
      setAddress(data.user.address ? data.user.address : null)
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
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
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
            roleIDs: roles.map(role => role.id),
            address: {
              company: address?.company ? address.company : '',
              streetAddress: address?.streetAddress ? address.streetAddress : '',
              streetAddress2: address?.streetAddress2 ? address.streetAddress2 : '',
              zipCode: address?.zipCode ? address.zipCode : '',
              city: address?.city ? address.city : '',
              country: address?.country ? address.country : ''
            }
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
            roleIDs: roles.map(role => role.id),
            address
          },
          password
        }
      })
      if (createData?.createUser) onSave?.(createData.createUser)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('userList.panels.editUser') : t('userList.panels.createUser')}
        </Drawer.Title>

        <Drawer.Actions>
          <Button appearance={'primary'} disabled={isDisabled} onClick={() => handleSave()}>
            {id ? t('userList.panels.save') : t('userList.panels.create')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('userList.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Panel>
          <Form fluid={true}>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.firstName')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.firstName')}
                value={firstName}
                disabled={isDisabled}
                onChange={(value: string) => setFirstName(value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.name')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.name')}
                value={name}
                disabled={isDisabled}
                onChange={(value: string) => setName(value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.preferredName')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.preferredName')}
                value={preferredName}
                disabled={isDisabled}
                onChange={(value: string) => setPreferredName(value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.email')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.email')}
                value={email}
                disabled={isDisabled}
                onChange={(value: string) => setEmail(value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.company')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.company')}
                value={address?.company}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'company', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.streetAddress')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.streetAddress')}
                value={address?.streetAddress}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'streetAddress', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.streetAddress2')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.streetAddress2')}
                value={address?.streetAddress2}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'streetAddress2', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.zipCode')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.zipCode')}
                value={address?.zipCode}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'zipCode', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.city')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.city')}
                value={address?.city}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'city', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.country')}</Form.ControlLabel>
              <Form.Control
                name={t('userList.panels.country')}
                value={address?.country}
                disabled={isDisabled}
                onChange={(value: string) =>
                  updateAddressObject(address, setAddress, 'country', value)
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.active')}</Form.ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
            </Form.Group>
            {!id ? (
              <Form.Group>
                <Form.ControlLabel>{t('userList.panels.password')}</Form.ControlLabel>
                <Form.Control
                  type="password"
                  name={t('userList.panels.password')}
                  value={password}
                  disabled={isDisabled}
                  onChange={(value: string) => setPassword(value)}
                />
              </Form.Group>
            ) : (
              <Form.Group>
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
                      toaster.push(
                        <Message type="success" showIcon closable duration={2000}>
                          {t('userList.panels.sendWebsiteLoginSuccessMessage', {email})}
                        </Message>
                      )
                    } catch (error) {
                      toaster.push(
                        <Message type="error" showIcon closable duration={0}>
                          {t('userList.panel.sendWebsiteLoginFailureMessage', {error})}
                        </Message>
                      )
                    }
                  }}>
                  {t('userList.panels.sendWebsiteLogin')}
                </Button>
              </Form.Group>
            )}
            <Form.Group>
              <Form.ControlLabel>{t('userList.panels.userRoles')}</Form.ControlLabel>
              <CheckPicker
                name={t('userList.panels.userRoles')}
                block={true}
                value={roles.map(role => role.id)}
                data={userRoles.map(userRole => ({value: userRole.id, label: userRole.name}))}
                placement={'auto'}
                onChange={value => {
                  setRoles(userRoles.filter(userRole => value.includes(userRole.id)))
                }}
              />
            </Form.Group>
          </Form>
        </Panel>
      </Drawer.Body>

      <Modal open={isResetUserPasswordOpen} onClose={() => setIsResetUserPasswordOpen(false)}>
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
