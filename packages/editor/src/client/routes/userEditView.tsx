import React, {useEffect, useState} from 'react'
import {
  Button,
  CheckPicker,
  Col,
  FlexboxGrid,
  Form,
  Grid,
  Loader,
  Message,
  Panel,
  Row,
  Schema,
  toaster,
  Toggle
} from 'rsuite'
import {
  FullUserFragment,
  FullUserRoleFragment,
  useCreateUserMutation,
  UserAddress,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery
} from '../api'
import {
  Link,
  RouteType,
  UserEditViewRoute,
  UserListRoute,
  useRoute,
  useRouteDispatch
} from '../route'
import {useTranslation} from 'react-i18next'
import {EditUserPassword} from '../atoms/user/editUserPassword'
import {RouteActionType} from '@wepublish/karma.run-react'
import {UserSubscriptionsList} from '../atoms/user/userSubscriptionsList'
import {ArrowLeftLine} from '@rsuite/icons'
import {toggleRequiredLabel} from '../toggleRequiredLabel'

export function UserEditView() {
  const {t} = useTranslation()
  const {current} = useRoute()
  const dispatch = useRouteDispatch()
  const [closeAfterSave, setCloseAfterSave] = useState<boolean>(false)

  // user props
  const [name, setName] = useState('')
  const [firstName, setFirstName] = useState<string | undefined | null>()
  const [preferredName, setPreferredName] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<Date | null>(null)
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([])
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([])
  const [address, setAddress] = useState<UserAddress | null>(null)
  const [user, setUser] = useState<FullUserFragment | undefined | null>(null)

  // getting user id from url param
  const [id] = useState<string | undefined>(
    current?.type === RouteType.UserEditView ? current.params.id : undefined
  )
  const {data: userRoleData, loading: isUserRoleLoading} = useUserRoleListQuery({
    fetchPolicy: 'network-only',
    variables: {
      first: 200
    }
  })

  /**
   * fetch user from api
   */
  const {data, loading: isLoading, error: loadError} = useUserQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })
  /**
   * setup user whenever user data object changes
   */
  useEffect(() => {
    const tmpUser = data?.user
    if (!tmpUser) return
    setUser(tmpUser)
    setFirstName(tmpUser.firstName)
    setName(tmpUser.name)
    setPreferredName(tmpUser.preferredName ?? undefined)
    setEmail(tmpUser.email)
    setEmailVerifiedAt(tmpUser.emailVerifiedAt ? new Date(tmpUser.emailVerifiedAt) : null)
    setActive(tmpUser.active)
    setAddress(tmpUser.address ? tmpUser.address : null)
    if (tmpUser.roles) {
      setRoles(tmpUser.roles as FullUserRoleFragment[])
    }
  }, [data?.user])

  /**
   * Setup user roles, whenever user role data object changes
   */
  useEffect(() => {
    if (userRoleData?.userRoles?.nodes) {
      setUserRoles(userRoleData.userRoles.nodes)
    }
  }, [userRoleData?.userRoles])

  const [createUser, {loading: isCreating}] = useCreateUserMutation()
  const [updateUser, {loading: isUpdating}] = useUpdateUserMutation()

  const isDisabled =
    isLoading || isUserRoleLoading || isCreating || isUpdating || loadError !== undefined

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

  /**
   * Validation schema
   */
  const {StringType} = Schema.Types
  const validatePassword: any = id
    ? StringType().minLength(8, t('errorMessages.passwordTooShortErrorMessage'))
    : StringType()
        .minLength(8, t('errorMessages.passwordTooShortErrorMessage'))
        .isRequired(t('errorMessages.noPasswordErrorMessage'))
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    email: StringType()
      .isRequired(t('errorMessages.noEmailErrorMessage'))
      .isEmail(t('errorMessages.invalidEmailErrorMessage')),
    password: validatePassword
  })

  /**
   * Save or create new user
   */
  async function createOrUpdateUser() {
    if (user) {
      try {
        await updateUser({
          variables: {
            id: user.id,
            input: {
              name,
              firstName: firstName || undefined,
              preferredName,
              email,
              emailVerifiedAt: emailVerifiedAt ? emailVerifiedAt.toISOString() : null,
              active,
              properties: user.properties.map(({value, key, public: publicValue}) => ({
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
        toaster.push(
          <Message type="success" showIcon closable duration={2000}>
            {t('userCreateOrEditView.successfullyUpdatedUser')}
          </Message>
        )
        // go back to user list
        if (closeAfterSave) {
          dispatch({
            type: RouteActionType.PushRoute,
            route: UserListRoute.create({})
          })
        }
      } catch (e) {
        toaster.push(
          <Message type="error" showIcon closable duration={2000}>
            {t('userCreateOrEditView.errorOnUpdate', {error: e})}
          </Message>
        )
      }
    } else {
      try {
        const {data} = await createUser({
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
        const newUser = data?.createUser
        if (!newUser) {
          throw new Error('User id not created')
        }
        // notify user
        toaster.push(
          <Message type="success" showIcon closable duration={2000}>
            {t('userCreateOrEditView.successfullyCreatedUser')}
          </Message>
        )
        // go back to user list
        if (closeAfterSave) {
          dispatch({
            type: RouteActionType.PushRoute,
            route: UserListRoute.create({})
          })
        } else {
          // stay in view and edit user
          dispatch({
            type: RouteActionType.PushRoute,
            route: UserEditViewRoute.create({id: newUser.id}, current ?? undefined)
          })
          setUser(newUser)
        }
      } catch (e) {
        toaster.push(
          <Message type="error" showIcon closable duration={2000}>
            {t('userCreateOrEditView.errorCreatingUser', {error: e})}
          </Message>
        )
      }
    }
  }

  /**
   * UI helpers
   */
  function titleView() {
    if (isDisabled) {
      return (
        <>
          <Loader style={{marginRight: '5px'}} />
          {t('userCreateOrEditView.loadingUser')}
        </>
      )
    }
    if (!user) {
      return t('userCreateOrEditView.createNewUser')
    }
    const firstName = user?.firstName
    const lastName = user?.name
    return firstName ? `${firstName} ${lastName}` : lastName
  }

  function actionsView() {
    return (
      <>
        {/* save button */}
        <Button
          appearance="ghost"
          loading={isDisabled}
          type="submit"
          data-testid="saveButton"
          style={{marginRight: '10px'}}>
          {user ? t('userCreateOrEditView.save') : t('userCreateOrEditView.create')}
        </Button>
        {/* save and close button */}
        <Button
          appearance="primary"
          loading={isDisabled}
          type="submit"
          data-testid="saveAndCloseButton"
          onClick={() => setCloseAfterSave(true)}>
          {user ? t('userCreateOrEditView.saveAndClose') : t('userCreateOrEditView.createAndClose')}
        </Button>
      </>
    )
  }

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && createOrUpdateUser()}
        fluid
        model={validationModel}
        formValue={{name: name, email, password}}>
        {/* heading */}
        <FlexboxGrid align="middle" style={{paddingRight: '5px', paddingBottom: '20px'}}>
          {/* title */}
          <FlexboxGrid.Item colspan={12}>
            <Row>
              <Col xs={2} style={{paddingTop: '3px'}}>
                <Link route={UserListRoute.create({})}>
                  <h1>
                    <ArrowLeftLine />
                  </h1>
                </Link>
              </Col>
              <Col xs={16}>
                <h2>{titleView()}</h2>
              </Col>
            </Row>
          </FlexboxGrid.Item>
          {/* actions */}
          <FlexboxGrid.Item colspan={12} style={{textAlign: 'right'}}>
            {actionsView()}
          </FlexboxGrid.Item>
        </FlexboxGrid>
        {/* user form */}
        <Grid style={{width: '100%', paddingLeft: '0px'}}>
          <Row gutter={10}>
            <Col xs={12}>
              <Grid fluid>
                {/* general user data */}
                <Panel bordered header={t('userCreateOrEditView.userDataTitle')}>
                  <Row gutter={10}>
                    {/* active / inactive */}
                    <Col xs={24} style={{textAlign: 'end'}}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.active')}</Form.ControlLabel>
                        <Toggle
                          checked={active}
                          disabled={isDisabled}
                          onChange={value => setActive(value)}
                        />
                      </Form.Group>
                    </Col>
                    {/* first name */}
                    <Col xs={12}>
                      <Form.Group controlId="firstName">
                        <Form.ControlLabel>{t('userCreateOrEditView.firstName')}</Form.ControlLabel>
                        <Form.Control
                          name="firstName"
                          value={firstName || undefined}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setFirstName(value)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    {/* name */}
                    <Col xs={12}>
                      <Form.Group controlId="name">
                        <Form.ControlLabel>
                          {toggleRequiredLabel(t('userCreateOrEditView.name'))}
                        </Form.ControlLabel>

                        <Form.Control
                          name="name"
                          value={name || ''}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setName(value)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    {/* preferred name */}
                    <Col xs={12}>
                      <Form.Group>
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.preferredName')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="preferredName"
                          value={preferredName || ''}
                          disabled={isDisabled}
                          onChange={(value: string) => setPreferredName(value)}
                        />
                      </Form.Group>
                    </Col>
                    {/* email */}
                    <Col xs={12}>
                      <Form.Group controlId="email">
                        <Form.ControlLabel>
                          {toggleRequiredLabel(t('userCreateOrEditView.email'))}
                        </Form.ControlLabel>

                        <Form.Control
                          name="email"
                          value={email}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setEmail(value)
                          }}
                        />
                      </Form.Group>
                    </Col>
                    {/* company */}
                    <Col xs={24}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.company')}</Form.ControlLabel>
                        <Form.Control
                          name="company"
                          value={address?.company || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'company', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* street */}
                    <Col xs={12}>
                      <Form.Group>
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddress')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddress"
                          value={address?.streetAddress || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'streetAddress', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* street 2 */}
                    <Col xs={12}>
                      <Form.Group>
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddress2')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddress2"
                          value={address?.streetAddress2 || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'streetAddress2', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* zip */}
                    <Col xs={8}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.zipCode')}</Form.ControlLabel>
                        <Form.Control
                          name="zipCode"
                          value={address?.zipCode || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'zipCode', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* city */}
                    <Col xs={16}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.city')}</Form.ControlLabel>
                        <Form.Control
                          name="city"
                          value={address?.city || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'city', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* country */}
                    <Col xs={24}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.country')}</Form.ControlLabel>
                        <Form.Control
                          name="country"
                          value={address?.country || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(address, setAddress, 'country', value)
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Panel>
                {/* roles */}
                <Panel
                  bordered
                  header={t('userCreateOrEditView.userRoles')}
                  style={{marginTop: '20px'}}>
                  <Row gutter={10}>
                    <Col xs={24}>
                      <Form.Group>
                        <Form.ControlLabel>{t('userCreateOrEditView.userRoles')}</Form.ControlLabel>
                        <CheckPicker
                          name="userRoles"
                          block
                          value={roles.map(role => role.id)}
                          data={userRoles.map(userRole => ({
                            value: userRole.id,
                            label: userRole.name
                          }))}
                          placement={'auto'}
                          onChange={value => {
                            setRoles(userRoles.filter(userRole => value.includes(userRole.id)))
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Panel>
                {/* password */}
                <Panel
                  bordered
                  header={t('userCreateOrEditView.passwordHeader')}
                  style={{marginTop: '20px'}}>
                  <Row gutter={10}>
                    <Col xs={24}>
                      <EditUserPassword
                        user={user}
                        password={password}
                        setPassword={setPassword}
                        isDisabled={isDisabled}
                      />
                    </Col>
                  </Row>
                </Panel>
              </Grid>
            </Col>
            {/* subscriptions */}
            <Col xs={12}>
              <Grid fluid style={{paddingRight: '0px'}}>
                <Panel bordered header={t('userCreateOrEditView.subscriptionsHeader')}>
                  <UserSubscriptionsList subscriptions={user?.subscriptions} />
                </Panel>
              </Grid>
            </Col>
          </Row>
        </Grid>
      </Form>
    </>
  )
}
