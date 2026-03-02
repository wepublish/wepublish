import styled from '@emotion/styled';
import {
  FullImageFragment,
  FullUserFragment,
  FullUserRoleFragment,
  useCreateUserMutation,
  UserAddress,
  useUpdateUserMutation,
  useUserQuery,
  useUserRoleListQuery,
  useUserSubscriptionListQuery,
} from '@wepublish/editor/api';
import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  EditUserPassword,
  generateID,
  ImageSelectPanel,
  ListInput,
  ListValue,
  SingleViewTitle,
  Textarea,
  toggleRequiredLabel,
  useAuthorisation,
  UserSubscriptionsList,
} from '@wepublish/ui/editor';
import { userCountryNames } from '@wepublish/user';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CheckPicker,
  Col,
  DatePicker,
  Drawer,
  Form,
  Grid as RGrid,
  Input,
  Message,
  Panel as RPanel,
  Row,
  Schema,
  SelectPicker,
  toaster,
  Toggle as RToggle,
} from 'rsuite';

const Grid = styled(RGrid)`
  padding-right: 0px;
`;

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
`;

const InputW60 = styled(Input)`
  width: 60%;
`;

const InputW40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const Panel = styled(RPanel)`
  margin-top: 20px;
`;

const ColTextAlign = styled(Col)`
  text-align: end;
`;

const UserFormGrid = styled(RGrid)`
  width: 100%;
  padding-left: 0px;
  height: calc(100vh - 160px);
  overflow-y: scroll;
`;

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`;

export interface UserProperty {
  readonly key: string;
  readonly value: string;
  readonly public: boolean;
}

function UserEditView() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { id: userId } = params;
  const closePath = '/users';

  const isEditRoute = location.pathname.includes('edit');
  const [closeAfterSave, setCloseAfterSave] = useState<boolean>(false);

  // image selection drawer
  const [imageSelectionOpen, setImageSelectionOpen] = useState<boolean>(false);

  // user props
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState<string | undefined>();
  const [note, setNote] = useState<string>();
  const [birthday, setBirthday] = useState<Date>();
  const [flair, setFlair] = useState<string>();
  const [email, setEmail] = useState('');
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<Date | null>(null);
  const [password, setPassword] = useState('');
  const [active, setActive] = useState(true);
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([]);
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([]);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [userImage, setUserImage] = useState<FullImageFragment>();
  const [user, setUser] = useState<FullUserFragment | null>(null);
  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<UserProperty>[]
  >([]);

  const { data: subscriptionData } = useUserSubscriptionListQuery({
    skip: !userId,
    variables: {
      userId: userId!,
    },
  });

  // getting user id from url param
  const [id] = useState<string | undefined>(isEditRoute ? userId : undefined);
  const { data: userRoleData, loading: isUserRoleLoading } =
    useUserRoleListQuery({
      variables: {
        take: 200,
      },
    });

  /**
   * fetch user from api
   */
  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useUserQuery({
    variables: { id: id! },
    skip: id === undefined,
  });
  /**
   * setup user whenever user data object changes
   */
  useEffect(() => {
    const tmpUser = data?.user;

    if (!tmpUser) {
      return;
    }

    setUser(tmpUser);
    setFirstName(tmpUser.firstName ?? undefined);
    setName(tmpUser.name);
    setNote(tmpUser.note ?? undefined);
    setFlair(tmpUser.flair ?? undefined);
    setBirthday(tmpUser.birthday ? new Date(tmpUser.birthday) : undefined);
    setEmail(tmpUser.email);
    setMetadataProperties(
      tmpUser?.properties ?
        tmpUser?.properties.map(userProperty => ({
          id: generateID(),
          value: userProperty,
        }))
      : []
    );
    setEmailVerifiedAt(
      tmpUser.emailVerifiedAt ? new Date(tmpUser.emailVerifiedAt) : null
    );
    setActive(tmpUser.active);
    setAddress(tmpUser.address ? tmpUser.address : null);
    setUserImage(tmpUser.image ? tmpUser.image : undefined);

    if (tmpUser.roles) {
      setRoles(tmpUser.roles as FullUserRoleFragment[]);
    }
  }, [data?.user]);

  /**
   * Setup user roles, whenever user role data object changes
   */
  useEffect(() => {
    if (userRoleData?.userRoles?.nodes) {
      setUserRoles(userRoleData.userRoles.nodes);
    }
  }, [userRoleData?.userRoles]);

  const [createUser, { loading: isCreating }] = useCreateUserMutation({});
  const [updateUser, { loading: isUpdating }] = useUpdateUserMutation({});

  const isDisabled =
    isLoading ||
    isUserRoleLoading ||
    isCreating ||
    isUpdating ||
    loadError !== undefined;
  const canResetPassword = useAuthorisation('CAN_RESET_USER_PASSWORD');

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
    key:
      | 'company'
      | 'streetAddress'
      | 'streetAddressNumber'
      | 'streetAddress2'
      | 'streetAddress2Number'
      | 'zipCode'
      | 'city'
      | 'country',
    value: string | null
  ) {
    let addressCopy = Object.assign({}, address);
    if (!address) {
      addressCopy = {
        company: '',
        streetAddress: '',
        streetAddressNumber: '',
        streetAddress2: '',
        streetAddress2Number: '',
        zipCode: '',
        city: '',
        country: '',
      };
    }
    addressCopy[key] = value || '';
    setAddress(addressCopy);
  }

  /**
   * Validation schema
   */
  const { StringType } = Schema.Types;
  const validatePassword: any =
    id ?
      StringType().minLength(
        12,
        t('errorMessages.passwordTooShortErrorMessage')
      )
    : StringType()
        .minLength(12, t('errorMessages.passwordTooShortErrorMessage'))
        .isRequired(t('errorMessages.noPasswordErrorMessage'));
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    email: StringType()
      .isRequired(t('errorMessages.noEmailErrorMessage'))
      .isEmail(t('errorMessages.invalidEmailErrorMessage')),
    password: validatePassword,
    country: StringType().isOneOf(
      userCountryNames,
      t('errorMessages.invalidCountry')
    ),
  });

  /**
   * Save or create new user
   */
  async function createOrUpdateUser() {
    if (user) {
      try {
        await updateUser({
          variables: {
            id: user.id,
            name,
            firstName: firstName || undefined,
            note,
            flair,
            birthday: birthday?.toISOString() ?? null,
            email,
            emailVerifiedAt: emailVerifiedAt?.toISOString() ?? null,
            active,
            userImageID: userImage?.id ?? null,
            roleIDs: roles.map(role => role.id),
            properties: metaDataProperties.map(
              ({ value: { key, public: isPublic, value: newValue } }) => ({
                key,
                public: isPublic,
                value: newValue,
              })
            ),
            address: {
              company: address?.company ? address.company : '',
              streetAddress:
                address?.streetAddress ? address.streetAddress : '',
              streetAddressNumber:
                address?.streetAddressNumber ? address.streetAddressNumber : '',
              streetAddress2:
                address?.streetAddress2 ? address.streetAddress2 : '',
              streetAddress2Number:
                address?.streetAddress2Number ?
                  address.streetAddress2Number
                : '',
              zipCode: address?.zipCode ? address.zipCode : '',
              city: address?.city ? address.city : '',
              country: address?.country ? address.country : '',
            },
          },
        });
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={2000}
          >
            {t('userCreateOrEditView.successfullyUpdatedUser')}
          </Message>
        );
        // go back to user list
        if (closeAfterSave) {
          navigate('/users');
        }
      } catch (e) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={2000}
          >
            {t('userCreateOrEditView.errorOnUpdate', { error: e })}
          </Message>
        );
      }
    } else {
      try {
        const { data } = await createUser({
          variables: {
            name,
            firstName,
            note,
            flair,
            birthday: birthday?.toISOString(),
            email,
            emailVerifiedAt: null,
            active,
            properties: metaDataProperties.map(
              ({ value: { key, public: isPublic, value: newValue } }) => ({
                key,
                public: isPublic,
                value: newValue,
              })
            ),
            roleIDs: roles.map(role => role.id),
            address,
            userImageID: userImage?.id || null,
            password,
          },
        });
        const newUser = data?.createUser;
        if (!newUser) {
          throw new Error('User id not created');
        }
        // notify user
        toaster.push(
          <Message
            type="success"
            showIcon
            closable
            duration={2000}
          >
            {t('userCreateOrEditView.successfullyCreatedUser')}
          </Message>
        );
        // go back to user list
        if (closeAfterSave) {
          navigate('/users');
        } else {
          navigate(`/users/edit/${newUser.id}`);
          setUser(newUser);
        }
      } catch (e) {
        toaster.push(
          <Message
            type="error"
            showIcon
            closable
            duration={2000}
          >
            {t('userCreateOrEditView.errorCreatingUser', { error: e })}
          </Message>
        );
      }
    }
  }

  /**
   * UI helpers
   */
  function titleView() {
    if (!user) {
      return t('userCreateOrEditView.createNewUser');
    }
    const firstName = user?.firstName;
    const lastName = user?.name;
    return firstName ? `${firstName} ${lastName}` : lastName;
  }

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && createOrUpdateUser()}
        fluid
        model={validationModel}
        formValue={{ name, email, password, country: address?.country }}
      >
        <SingleViewTitle
          loading={false}
          title={titleView()}
          loadingTitle={t('comments.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setCloseAfterSave}
        />
        <UserFormGrid>
          <Row gutter={10}>
            <Col xs={12}>
              <RGrid fluid>
                {/* general user data */}
                <RPanel
                  bordered
                  header={t('userCreateOrEditView.userDataTitle')}
                >
                  <Row>
                    {/* profile image */}
                    <Col xs={12}>
                      <ChooseEditImage
                        image={userImage}
                        disabled={false}
                        openChooseModalOpen={() => setImageSelectionOpen(true)}
                        removeImage={() => setUserImage(undefined)}
                        header={t('userCreateOrEditView.selectUserImage')}
                        maxHeight={200}
                      />
                    </Col>
                    {/* active / inactive */}
                    <ColTextAlign xs={12}>
                      <Form.Group controlId="active">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.active')}
                        </Form.ControlLabel>
                        <RToggle
                          checked={active}
                          disabled={isDisabled}
                          onChange={value => setActive(value)}
                        />
                      </Form.Group>
                    </ColTextAlign>
                  </Row>

                  <Row gutter={10}>
                    {/* first name */}
                    <Col xs={12}>
                      <Form.Group controlId="firstName">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.firstName')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="firstName"
                          value={firstName || undefined}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setFirstName(value);
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
                            setName(value);
                          }}
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
                            setEmail(value);
                          }}
                        />
                      </Form.Group>
                    </Col>
                    {/* birthday */}
                    <Col xs={12}>
                      <Form.Group controlId="birthday">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.birthday')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="birthday"
                          autoComplete="birthday"
                          block
                          oneTap
                          isoWeek
                          format="dd.MM.yyyy"
                          limitEndYear={0}
                          value={birthday}
                          disabled={isDisabled}
                          onChange={value => {
                            setBirthday(value as Date);
                          }}
                          accepter={DatePicker}
                        />
                      </Form.Group>
                    </Col>
                    {/* flair */}
                    <Col xs={12}>
                      <Form.Group controlId="flair">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.flair')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="flair"
                          value={flair}
                          disabled={isDisabled}
                          onChange={(value: string) => setFlair(value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* company */}
                    <Col xs={12}>
                      <Form.Group controlId="company">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.company')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="company"
                          value={address?.company || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'company',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* street */}
                    <Col xs={18}>
                      <Form.Group controlId="streetAddress">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddress')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddress"
                          value={address?.streetAddress || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'streetAddress',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group controlId="streetAddressNumber">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddressNumber')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddressNumber"
                          value={address?.streetAddressNumber || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'streetAddressNumber',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* street 2 */}
                    <Col xs={18}>
                      <Form.Group controlId="streetAddress2">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddress2')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddress2"
                          value={address?.streetAddress2 || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'streetAddress2',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={6}>
                      <Form.Group controlId="streetAddress2Number">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.streetAddress2Number')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="streetAddress2Number"
                          value={address?.streetAddress2Number || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'streetAddress2Number',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* zip */}
                    <Col xs={8}>
                      <Form.Group controlId="zipCode">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.zipCode')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="zipCode"
                          value={address?.zipCode || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'zipCode',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* city */}
                    <Col xs={16}>
                      <Form.Group controlId="city">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.city')}
                        </Form.ControlLabel>
                        <Form.Control
                          name="city"
                          value={address?.city || ''}
                          disabled={isDisabled}
                          onChange={(value: string) =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'city',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                    {/* country */}
                    <Col xs={24}>
                      <Form.Group controlId="country">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.country')}
                        </Form.ControlLabel>

                        <Form.Control
                          name="country"
                          accepter={SelectPicker}
                          block
                          cleanable
                          searchable
                          data={userCountryNames.map(item => ({
                            label: item,
                            value: item,
                          }))}
                          placeholder={address?.country ?? undefined}
                          value={address?.country ?? ''}
                          disabled={isDisabled}
                          onChange={value =>
                            updateAddressObject(
                              address,
                              setAddress,
                              'country',
                              value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={24}>
                      <Form.Group controlId="note">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.note')}
                        </Form.ControlLabel>

                        <Form.Control
                          name="note"
                          rows={5}
                          accepter={Textarea}
                          value={note || ''}
                          disabled={isDisabled}
                          onChange={setNote}
                        />

                        <Form.HelpText>
                          {t('userCreateOrEditView.noteHelpText')}
                        </Form.HelpText>
                      </Form.Group>
                    </Col>
                  </Row>
                </RPanel>
                {/* roles */}
                <Panel
                  bordered
                  header={t('userCreateOrEditView.userRoles')}
                >
                  <Row gutter={10}>
                    <Col xs={24}>
                      <Form.Group controlId="userRoles">
                        <Form.ControlLabel>
                          {t('userCreateOrEditView.userRoles')}
                        </Form.ControlLabel>
                        <CheckPicker
                          name="userRoles"
                          block
                          value={roles.map(role => role.id)}
                          data={userRoles.map(userRole => ({
                            value: userRole.id,
                            label: userRole.name,
                          }))}
                          placement={'auto'}
                          onChange={value => {
                            setRoles(
                              userRoles.filter(userRole =>
                                value.includes(userRole.id)
                              )
                            );
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Panel>
                {/* properties */}
                <Panel
                  bordered
                  header={t('userCreateOrEditView.properties')}
                >
                  <Row gutter={10}>
                    <Col xs={24}>
                      <Form.Group controlId="userProperties">
                        <Form.ControlLabel>
                          {t('articleEditor.panels.properties')}
                        </Form.ControlLabel>
                        <ListInput
                          value={metaDataProperties}
                          onChange={propertiesItemInput =>
                            setMetadataProperties(propertiesItemInput)
                          }
                          defaultValue={{ key: '', value: '', public: true }}
                        >
                          {({ value, onChange }) => (
                            <FlexRow>
                              <InputW40
                                placeholder={t('articleEditor.panels.key')}
                                value={value.key}
                                onChange={propertyKey =>
                                  onChange({ ...value, key: propertyKey })
                                }
                                data-testid="propertyKey"
                              />
                              <InputW60
                                placeholder={t('articleEditor.panels.value')}
                                value={value.value}
                                onChange={propertyValue =>
                                  onChange({ ...value, value: propertyValue })
                                }
                                data-testid="propertyValue"
                              />
                              <FormGroup controlId="articleProperty">
                                <Toggle
                                  checkedChildren={t(
                                    'articleEditor.panels.public'
                                  )}
                                  unCheckedChildren={t(
                                    'articleEditor.panels.private'
                                  )}
                                  checked={value.public}
                                  onChange={isPublic =>
                                    onChange({ ...value, public: isPublic })
                                  }
                                />
                              </FormGroup>
                            </FlexRow>
                          )}
                        </ListInput>
                      </Form.Group>
                    </Col>
                  </Row>
                </Panel>
                {/* password */}
                <Panel
                  bordered
                  header={t('userCreateOrEditView.passwordHeader')}
                >
                  <Row gutter={10}>
                    <Col xs={24}>
                      <EditUserPassword
                        user={user}
                        password={password}
                        setPassword={setPassword}
                        isDisabled={isDisabled || !canResetPassword}
                      />
                    </Col>
                  </Row>
                </Panel>
              </RGrid>
            </Col>
            {/* subscriptions */}
            {subscriptionData?.subscriptions.nodes && (
              <Col xs={12}>
                <Grid fluid>
                  <RPanel
                    bordered
                    header={t('userCreateOrEditView.subscriptionsHeader')}
                  >
                    <UserSubscriptionsList
                      subscriptions={subscriptionData.subscriptions.nodes}
                      userId={user?.id}
                    />
                  </RPanel>
                </Grid>
              </Col>
            )}
          </Row>
        </UserFormGrid>
      </Form>

      {/* image selection panel */}
      <Drawer
        open={imageSelectionOpen}
        onClose={() => {
          setImageSelectionOpen(false);
        }}
      >
        <ImageSelectPanel
          onClose={() => setImageSelectionOpen(false)}
          onSelect={(image: FullImageFragment) => {
            setUserImage(image);
            setImageSelectionOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_USER',
  'CAN_CREATE_USER',
  'CAN_DELETE_USER',
  'CAN_GET_USERS',
  'CAN_RESET_USER_PASSWORD',
])(UserEditView);
export { CheckedPermissionComponent as UserEditView };
