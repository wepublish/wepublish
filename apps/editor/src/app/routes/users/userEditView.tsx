import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Drawer,
  FormControlLabel,
  Grid,
  Switch,
} from '@mui/material';
import {
  AccountCreationMailDocument,
  CreateUserDocument,
  FullImageFragment,
  FullUserFragment,
  FullUserRoleFragment,
  ResetUserTotpDocument,
  UpdateUserDocument,
  UserAddress,
  UserDocument,
  UserRoleListDocument,
  UserSubscriptionListDocument,
} from '@wepublish/editor/api';
import {
  SendMailToUserPanel,
  UserMailLogPanel,
} from '@wepublish/membership/editor';
import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  DRAWER_WIDTHS,
  EditUserPassword,
  enqueueSnackbar,
  generateID,
  ImageSelectPanel,
  InfoTooltip,
  ListInput,
  ListValue,
  SingleViewTitle,
  skipMailFor,
  Textarea,
  toggleRequiredLabel,
  useActionMailQuestion,
  useAuthorisation,
  UserSubscriptionsList,
} from '@wepublish/ui/editor';
import { userCountryNames } from '@wepublish/user';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLockReset } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CheckPicker,
  DatePicker,
  Form,
  Input,
  Schema,
  SelectPicker,
} from 'rsuite';

const PropertyRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto;
  align-items: center;
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const UserFormGrid = styled.div`
  width: 100%;
  height: calc(100vh - 160px);
  overflow-y: auto;

  @media (max-width: 899px) {
    height: auto;
    overflow: visible;
  }
`;

const PageColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
  padding-bottom: 20px;

  @media (max-width: 1099px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const PanelStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
`;

const ProfileImage = styled.div`
  .rs-panel {
    border: none;
    box-shadow: none;
  }

  .rs-panel-header {
    padding: 0 0 6px;
    font-size: var(--rs-font-size-sm);
    font-weight: 400;
  }

  .rs-panel-body {
    padding: 0;
  }
`;

const FormGroup = styled(Form.Group)`
  flex-shrink: 0;
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
  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();
  const [roles, setRoles] = useState<FullUserRoleFragment[]>([]);
  const [userRoles, setUserRoles] = useState<FullUserRoleFragment[]>([]);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [userImage, setUserImage] = useState<FullImageFragment>();
  const [user, setUser] = useState<FullUserFragment | null>(null);
  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<UserProperty>[]
  >([]);

  const { data: subscriptionData } = useQuery(UserSubscriptionListDocument, {
    skip: !userId,
    variables: {
      userId: userId!,
    },
  });

  // getting user id from url param
  const [id] = useState<string | undefined>(isEditRoute ? userId : undefined);
  const { data: userRoleData, loading: isUserRoleLoading } = useQuery(
    UserRoleListDocument,
    {
      variables: {
        take: 200,
      },
    }
  );

  /**
   * fetch user from api
   */
  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useQuery(UserDocument, {
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

  const [createUser, { loading: isCreating }] = useMutation(
    CreateUserDocument,
    {}
  );
  const [updateUser, { loading: isUpdating }] = useMutation(
    UpdateUserDocument,
    {}
  );

  const isDisabled =
    isLoading ||
    isUserRoleLoading ||
    isCreating ||
    isUpdating ||
    loadError !== undefined;
  const canResetPassword = useAuthorisation('CAN_RESET_USER_PASSWORD');
  const canResetTotp = useAuthorisation('CAN_RESET_USER_TOTP');

  const [resetUserTotp, { loading: isResettingTotp }] = useMutation(
    ResetUserTotpDocument
  );

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
        __typename: 'UserAddress',
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
        enqueueSnackbar(t('userCreateOrEditView.successfullyUpdatedUser'), {
          variant: 'success',
          autoHideDuration: 2000,
        });
        // go back to user list
        if (closeAfterSave) {
          navigate('/users');
        }
      } catch (e) {
        enqueueSnackbar(t('userCreateOrEditView.errorOnUpdate', { error: e }), {
          variant: 'error',
          autoHideDuration: 8000,
        });
      }
    } else {
      try {
        const { data: mailData } = await client.query({
          query: AccountCreationMailDocument,
          fetchPolicy: 'network-only',
        });
        const mail = mailData?.accountCreationMail;

        if (!mail) {
          throw new Error('Could not look up the mail of this action');
        }

        // asked every time: whether the mail goes out, or that none will
        const decision = await askMail({ ...mail, recipient: email });

        if (decision === 'cancel') {
          return;
        }

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
            skipMail: skipMailFor(decision),
          },
        });
        const newUser = data?.createUser;
        if (!newUser) {
          throw new Error('User id not created');
        }
        // notify user
        enqueueSnackbar(t('userCreateOrEditView.successfullyCreatedUser'), {
          variant: 'success',
          autoHideDuration: 2000,
        });
        // go back to user list
        if (closeAfterSave) {
          navigate('/users');
        } else {
          navigate(`/users/edit/${newUser.id}`);
          setUser(newUser);
        }
      } catch (e) {
        enqueueSnackbar(
          t('userCreateOrEditView.errorCreatingUser', { error: e }),
          { variant: 'error', autoHideDuration: 8000 }
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
          <PageColumns>
            <PanelStack>
              {/* general user data */}
              <Card variant="outlined">
                <CardHeader title={t('userCreateOrEditView.userDataTitle')} />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    {/* active / inactive */}
                    <Grid size={{ xs: 12 }}>
                      <Form.Group controlId="active">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={active}
                              disabled={isDisabled}
                              onChange={(_event, value) => setActive(value)}
                            />
                          }
                          label={
                            <>
                              {t('userCreateOrEditView.active')}{' '}
                              <InfoTooltip
                                text={t('userCreateOrEditView.activeInfo')}
                              />
                            </>
                          }
                        />
                      </Form.Group>
                    </Grid>
                    {/* first name */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="firstName">
                        <Form.Label>
                          {t('userCreateOrEditView.firstName')}
                        </Form.Label>
                        <Form.Control
                          name="firstName"
                          value={firstName || undefined}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setFirstName(value);
                          }}
                        />
                      </Form.Group>
                    </Grid>
                    {/* name */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="name">
                        <Form.Label>
                          {toggleRequiredLabel(t('userCreateOrEditView.name'))}
                        </Form.Label>

                        <Form.Control
                          name="name"
                          value={name || ''}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setName(value);
                          }}
                        />
                      </Form.Group>
                    </Grid>
                    {/* email */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="email">
                        <Form.Label>
                          {toggleRequiredLabel(t('userCreateOrEditView.email'))}
                        </Form.Label>

                        <Form.Control
                          name="email"
                          value={email}
                          disabled={isDisabled}
                          onChange={(value: string) => {
                            setEmail(value);
                          }}
                        />
                      </Form.Group>
                    </Grid>
                    {/* birthday */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="birthday">
                        <Form.Label>
                          {t('userCreateOrEditView.birthday')}
                        </Form.Label>
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
                    </Grid>
                    {/* flair */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="flair">
                        <Form.Label>
                          {t('userCreateOrEditView.flair')}{' '}
                          <InfoTooltip
                            text={t('userCreateOrEditView.flairInfo')}
                          />
                        </Form.Label>
                        <Form.Control
                          name="flair"
                          value={flair}
                          disabled={isDisabled}
                          onChange={(value: string) => setFlair(value)}
                        />
                      </Form.Group>
                    </Grid>

                    {/* company */}
                    <Grid size={{ xs: 6 }}>
                      <Form.Group controlId="company">
                        <Form.Label>
                          {t('userCreateOrEditView.company')}
                        </Form.Label>
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
                    </Grid>
                    {/* street */}
                    <Grid size={{ xs: 9 }}>
                      <Form.Group controlId="streetAddress">
                        <Form.Label>
                          {t('userCreateOrEditView.streetAddress')}
                        </Form.Label>
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
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                      <Form.Group controlId="streetAddressNumber">
                        <Form.Label>
                          {t('userCreateOrEditView.streetAddressNumber')}
                        </Form.Label>
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
                    </Grid>
                    {/* street 2 */}
                    <Grid size={{ xs: 9 }}>
                      <Form.Group controlId="streetAddress2">
                        <Form.Label>
                          {t('userCreateOrEditView.streetAddress2')}
                        </Form.Label>
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
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                      <Form.Group controlId="streetAddress2Number">
                        <Form.Label>
                          {t('userCreateOrEditView.streetAddress2Number')}
                        </Form.Label>
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
                    </Grid>
                    {/* zip */}
                    <Grid size={{ xs: 4 }}>
                      <Form.Group controlId="zipCode">
                        <Form.Label>
                          {t('userCreateOrEditView.zipCode')}
                        </Form.Label>
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
                    </Grid>
                    {/* city */}
                    <Grid size={{ xs: 8 }}>
                      <Form.Group controlId="city">
                        <Form.Label>
                          {t('userCreateOrEditView.city')}
                        </Form.Label>
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
                    </Grid>
                    {/* country */}
                    <Grid size={{ xs: 12 }}>
                      <Form.Group controlId="country">
                        <Form.Label>
                          {t('userCreateOrEditView.country')}
                        </Form.Label>

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
                    </Grid>

                    {/* profile image */}
                    <Grid size={{ xs: 4 }}>
                      <ProfileImage>
                        <ChooseEditImage
                          image={userImage}
                          disabled={false}
                          openChooseModalOpen={() =>
                            setImageSelectionOpen(true)
                          }
                          removeImage={() => setUserImage(undefined)}
                          header={t('userCreateOrEditView.selectUserImage')}
                          maxHeight={200}
                        />
                      </ProfileImage>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Form.Group controlId="note">
                        <Form.Label>
                          {t('userCreateOrEditView.note')}
                        </Form.Label>

                        <Form.Control
                          name="note"
                          rows={5}
                          accepter={Textarea}
                          value={note || ''}
                          disabled={isDisabled}
                          onChange={setNote}
                        />

                        <Form.Text>
                          {t('userCreateOrEditView.noteHelpText')}
                        </Form.Text>
                      </Form.Group>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* password */}
              <Card variant="outlined">
                <CardHeader title={t('userCreateOrEditView.passwordHeader')} />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <EditUserPassword
                        user={user}
                        password={password}
                        setPassword={setPassword}
                        isDisabled={isDisabled || !canResetPassword}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* properties */}
              <Card variant="outlined">
                <CardHeader
                  title={
                    <>
                      {t('userCreateOrEditView.properties')}{' '}
                      <InfoTooltip
                        text={t('userCreateOrEditView.propertiesInfo')}
                      />
                    </>
                  }
                />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <Form.Group controlId="userProperties">
                        <ListInput
                          value={metaDataProperties}
                          onChange={propertiesItemInput =>
                            setMetadataProperties(propertiesItemInput)
                          }
                          defaultValue={{ key: '', value: '', public: true }}
                        >
                          {({ value, onChange }) => (
                            <PropertyRow>
                              <Input
                                placeholder={t('articleEditor.panels.key')}
                                value={value.key}
                                onChange={propertyKey =>
                                  onChange({ ...value, key: propertyKey })
                                }
                                data-testid="propertyKey"
                              />
                              <Input
                                placeholder={t('articleEditor.panels.value')}
                                value={value.value}
                                onChange={propertyValue =>
                                  onChange({ ...value, value: propertyValue })
                                }
                                data-testid="propertyValue"
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={value.public}
                                    onChange={(_event, isPublic) =>
                                      onChange({ ...value, public: isPublic })
                                    }
                                  />
                                }
                                label={t('articleEditor.panels.public')}
                              />
                            </PropertyRow>
                          )}
                        </ListInput>
                      </Form.Group>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* roles */}
              <Card variant="outlined">
                <CardHeader
                  title={
                    <>
                      {t('userCreateOrEditView.userRoles')}{' '}
                      <InfoTooltip
                        text={t('userCreateOrEditView.userRolesInfo')}
                      />
                    </>
                  }
                />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <Form.Group controlId="userRoles">
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
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* two-factor authentication */}
              {user && canResetTotp && (
                <Card variant="outlined">
                  <CardHeader title={t('userCreateOrEditView.totpHeader')} />

                  <CardContent>
                    <Grid
                      container
                      spacing={2}
                    >
                      <Grid size={{ xs: 12 }}>
                        <p style={{ marginBottom: 12 }}>
                          {user.totpEnabled ?
                            t('userCreateOrEditView.totpEnabled')
                          : user.totpExempt ?
                            t('userCreateOrEditView.totpExemptInfo')
                          : t('userCreateOrEditView.totpDisabled')}
                        </p>
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<MdLockReset />}
                          disabled={!user.totpEnabled || isResettingTotp}
                          style={{ marginBottom: 16 }}
                          onClick={async () => {
                            try {
                              await resetUserTotp({
                                variables: { userId: user.id },
                              });
                              enqueueSnackbar(
                                t('userList.overview.totpResetSuccess'),
                                { variant: 'success', autoHideDuration: 2000 }
                              );
                            } catch (e) {
                              enqueueSnackbar(
                                t('userList.overview.totpResetError'),
                                { variant: 'error', autoHideDuration: 8000 }
                              );
                            }
                          }}
                        >
                          {t('userList.overview.resetTotp')}
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Form.Group controlId="totpExempt">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.totpExempt}
                                onChange={async (_event, value) => {
                                  if (
                                    value &&
                                    !window.confirm(
                                      t(
                                        'userCreateOrEditView.totpExemptWarning'
                                      )
                                    )
                                  ) {
                                    return;
                                  }
                                  try {
                                    await updateUser({
                                      variables: {
                                        id: user.id,
                                        name: user.name,
                                        email: user.email,
                                        totpExempt: value,
                                      },
                                    });
                                    setUser({ ...user, totpExempt: value });
                                    enqueueSnackbar(
                                      t(
                                        'userCreateOrEditView.successfullyUpdatedUser'
                                      ),
                                      {
                                        variant: 'success',
                                        autoHideDuration: 2000,
                                      }
                                    );
                                  } catch (e) {
                                    enqueueSnackbar(
                                      t('userCreateOrEditView.errorOnUpdate', {
                                        error: e,
                                      }),
                                      {
                                        variant: 'error',
                                        autoHideDuration: 8000,
                                      }
                                    );
                                  }
                                }}
                              />
                            }
                            label={t('userCreateOrEditView.totpExemptLabel')}
                          />
                        </Form.Group>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </PanelStack>
            {/* subscriptions + sent-mail history + manual mail sending */}
            {(subscriptionData?.subscriptions.nodes ||
              (isEditRoute && userId)) && (
              <PanelStack>
                {subscriptionData?.subscriptions.nodes && (
                  <Card variant="outlined">
                    <CardHeader
                      title={t('userCreateOrEditView.subscriptionsHeader')}
                    />

                    <CardContent>
                      <UserSubscriptionsList
                        subscriptions={subscriptionData.subscriptions.nodes}
                        userId={user?.id}
                      />
                    </CardContent>
                  </Card>
                )}
                {isEditRoute && userId && (
                  <>
                    <Card variant="outlined">
                      <CardHeader title={t('userMail.logTitle')} />

                      <CardContent>
                        <UserMailLogPanel userId={userId} />
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardHeader title={t('userMail.sendTitle')} />

                      <CardContent>
                        <SendMailToUserPanel userId={userId} />
                      </CardContent>
                    </Card>
                  </>
                )}
              </PanelStack>
            )}
          </PageColumns>
        </UserFormGrid>
      </Form>

      {actionMailDialog}

      {/* image selection panel */}
      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: DRAWER_WIDTHS.sm,
              maxWidth: '100vw',
            },
          },
        }}
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
