import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccountCreationMailDocument,
  CreateUserDocument,
  FullImageFragment,
  FullUserFragment,
  FullUserRoleFragment,
  LoginCodeSecondFactor,
  ReissueUserLoginCodeDocument,
  ResetUserTotpDocument,
  RevokeUserLoginCodeDocument,
  SettingsListDocument,
  UpdateUserDocument,
  UserAddress,
  UserDocument,
  UserLoginCodeDocument,
  UserRoleListDocument,
  UserSubscriptionListDocument,
} from '@wepublish/editor/api';
import {
  SendMailToUserPanel,
  UserDeliveryChannelControls,
  UserDeliveryChannelNotes,
  UserMailLogPanel,
} from '@wepublish/membership/editor';
import { isLoginCodeEnabled } from './login-code-enabled';
import {
  CanCreateUser,
  CanDeleteUser,
  CanGetUser,
  CanGetUsers,
  CanResetUserPassword,
  CanResetUserTotp,
} from '@wepublish/permissions';
import {
  ChooseEditImage,
  createCheckedPermissionComponent,
  DatePicker,
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
  toggleRequiredLabel,
  useActionMailQuestion,
  useAuthorisation,
  useFeature,
  UserSubscriptionsList,
} from '@wepublish/ui/editor';
import { userCountryNames } from '@wepublish/user';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdLockReset } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

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

export interface UserProperty {
  key: string;
  value: string;
  public: boolean;
}

const EMPTY_ADDRESS: UserAddress = {
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

const EMPTY_USER = {
  user: null as FullUserFragment | null,
  name: '',
  firstName: '',
  note: '',
  flair: '',
  birthday: null as Date | null,
  email: '',
  emailVerifiedAt: null as Date | null,
  password: '',
  active: true,
  roles: [] as FullUserRoleFragment[],
  address: EMPTY_ADDRESS,
  image: undefined as FullImageFragment | undefined,
  properties: [] as ListValue<UserProperty>[],
};

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
  const [loadError, setLoadError] = useState<Error>();

  const client = useApolloClient();
  const { askMail, actionMailDialog } = useActionMailQuestion();

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

  const userRoles = userRoleData?.userRoles?.nodes ?? [];

  const schema = z.object({
    user: z.custom<FullUserFragment>().nullable(),
    name: z.string().min(1, t('errorMessages.noNameErrorMessage')),
    firstName: z.string().nullish(),
    note: z.string().nullish(),
    flair: z.string().nullish(),
    birthday: z.date().nullish(),
    email: z.string().email(t('errorMessages.noEmailErrorMessage')),
    emailVerifiedAt: z.date().nullish(),
    password:
      id ?
        z.union([z.literal(''), z.string().min(12)]).nullish()
      : z.string().min(12),
    active: z.boolean(),
    roles: z.array(z.custom<FullUserRoleFragment>()),
    address: z.object({
      __typename: z.literal('UserAddress').optional(),
      company: z.string().nullish(),
      streetAddress: z.string().nullish(),
      streetAddressNumber: z.string().nullish(),
      streetAddress2: z.string().nullish(),
      streetAddress2Number: z.string().nullish(),
      zipCode: z.string().nullish(),
      city: z.string().nullish(),
      country: z.enum(userCountryNames as [string, ...string[]]).nullish(),
    }),
    image: z.custom<FullImageFragment>().optional(),
    properties: z.array(z.custom<ListValue<UserProperty>>()),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isLoading },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      if (!id) {
        return EMPTY_USER;
      }

      try {
        const { data } = await client.query({
          query: UserDocument,
          variables: { id },
        });
        const user = data?.user;

        return user ?
            {
              user,
              name: user.name,
              firstName: user.firstName ?? '',
              note: user.note ?? '',
              flair: user.flair ?? '',
              birthday: user.birthday ? new Date(user.birthday) : null,
              email: user.email,
              emailVerifiedAt:
                user.emailVerifiedAt ? new Date(user.emailVerifiedAt) : null,
              password: '',
              active: user.active,
              roles: (user.roles ?? []) as FullUserRoleFragment[],
              address: { ...EMPTY_ADDRESS, ...(user.address ?? {}) },
              image: user.image ?? undefined,
              properties:
                user.properties?.map(userProperty => ({
                  id: generateID(),
                  value: userProperty,
                })) ?? [],
            }
          : EMPTY_USER;
      } catch (error) {
        setLoadError(error as Error);

        return EMPTY_USER;
      }
    },
  });

  const user = useWatch({ control, name: 'user' });
  const userImage = useWatch({ control, name: 'image' });

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
  const canResetPassword = useAuthorisation(CanResetUserPassword.id);
  const canResetTotp = useAuthorisation(CanResetUserTotp.id);
  // The mail panel also lists printed letters once the medium has them.
  const paperLetters = useFeature('paper-letters');

  const [resetUserTotp, { loading: isResettingTotp }] = useMutation(
    ResetUserTotpDocument
  );
  const { data: settingsData } = useQuery(SettingsListDocument);
  // The panel only makes sense once the medium has login codes switched on.
  const canManageLoginCodes =
    useAuthorisation('CAN_MANAGE_USER_LOGIN_CODES') &&
    isLoginCodeEnabled(settingsData?.settings);
  const { data: loginCodeData, refetch: refetchLoginCode } = useQuery(
    UserLoginCodeDocument,
    {
      variables: { userId: user?.id ?? '' },
      skip: !user?.id || !canManageLoginCodes,
    }
  );
  const [revokeUserLoginCode, { loading: isRevokingLoginCode }] = useMutation(
    RevokeUserLoginCodeDocument
  );
  const [reissueUserLoginCode, { loading: isReissuingLoginCode }] = useMutation(
    ReissueUserLoginCodeDocument
  );
  const [issuedLoginCode, setIssuedLoginCode] = useState<{
    code: string;
    purl: string;
  } | null>(null);

  /**
   * Save or create new user
   */
  async function createOrUpdateUser(values: z.infer<typeof schema>) {
    const {
      user,
      name,
      firstName,
      note,
      flair,
      birthday,
      email,
      emailVerifiedAt,
      password,
      active,
      roles,
      address,
      image: userImage,
      properties: metaDataProperties,
    } = values;

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
              company: address.company ?? '',
              streetAddress: address.streetAddress ?? '',
              streetAddressNumber: address.streetAddressNumber ?? '',
              streetAddress2: address.streetAddress2 ?? '',
              streetAddress2Number: address.streetAddress2Number ?? '',
              zipCode: address.zipCode ?? '',
              city: address.city ?? '',
              country: address.country ?? '',
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
            address: {
              company: address.company ?? '',
              streetAddress: address.streetAddress ?? '',
              streetAddressNumber: address.streetAddressNumber ?? '',
              streetAddress2: address.streetAddress2 ?? '',
              streetAddress2Number: address.streetAddress2Number ?? '',
              zipCode: address.zipCode ?? '',
              city: address.city ?? '',
              country: address.country ?? '',
            },
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
          setValue('user', newUser);
        }
      } catch (e) {
        enqueueSnackbar(
          t('userCreateOrEditView.errorCreatingUser', { error: e }),
          { variant: 'error', autoHideDuration: 8000 }
        );
      }
    }
  }

  function titleView() {
    if (!user) {
      return t('userCreateOrEditView.createNewUser');
    }

    const firstName = user?.firstName;
    const lastName = user?.name;

    return firstName ? `${firstName} ${lastName}` : lastName;
  }

  if (isLoading) {
    return null;
  }

  return (
    <>
      <form onSubmit={handleSubmit(createOrUpdateUser)}>
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
          <PageColumns data-testid="user-columns">
            <PanelStack>
              <Card>
                <CardHeader title={t('userCreateOrEditView.userDataTitle')} />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <ChooseEditImage
                        onSelect={(image: FullImageFragment) => {
                          setValue('image', image);
                          setImageSelectionOpen(false);
                        }}
                        image={userImage}
                        disabled={false}
                        openChooseModalOpen={() => setImageSelectionOpen(true)}
                        removeImage={() => setValue('image', undefined)}
                        maxHeight={200}
                      />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Controller
                        control={control}
                        name="firstName"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.firstName')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Controller
                        control={control}
                        name="name"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label={toggleRequiredLabel(
                              t('userCreateOrEditView.name')
                            )}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Controller
                        control={control}
                        name="email"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            label={toggleRequiredLabel(
                              t('userCreateOrEditView.email')
                            )}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={
                              error?.message ??
                              // derived from bounces, logins and clicks; read-only
                              (user?.emailQuality &&
                                t('userCreateOrEditView.emailQuality', {
                                  level: t(
                                    `mailSend.emailSegments.${user.emailQuality.level}`
                                  ),
                                  reason: user.emailQuality.reason,
                                  since: new Date(
                                    user.emailQuality.since
                                  ).toLocaleDateString(),
                                }))
                            }
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Controller
                        control={control}
                        name="birthday"
                        render={({ field, fieldState: { error } }) => (
                          <DatePicker
                            label={t('userCreateOrEditView.birthday')}
                            disableFuture
                            value={field.value ?? null}
                            disabled={isDisabled}
                            onChange={field.onChange}
                            fullWidth
                            error={Boolean(error)}
                            helperText={error?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Controller
                        control={control}
                        name="flair"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={
                              <>
                                {t('userCreateOrEditView.flair')}{' '}
                                <InfoTooltip
                                  text={t('userCreateOrEditView.flairInfo')}
                                />
                              </>
                            }
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Controller
                        control={control}
                        name="note"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.note')}
                            multiline
                            rows={5}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={
                              error?.message ??
                              t('userCreateOrEditView.noteHelpText')
                            }
                            fullWidth
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title={t('userCreateOrEditView.addressTitle')} />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        control={control}
                        name="address.company"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.company')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 9 }}>
                      <Controller
                        control={control}
                        name="address.streetAddress"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.streetAddress')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                      <Controller
                        control={control}
                        name="address.streetAddressNumber"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t(
                              'userCreateOrEditView.streetAddressNumber'
                            )}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 9 }}>
                      <Controller
                        control={control}
                        name="address.streetAddress2"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.streetAddress2')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 3 }}>
                      <Controller
                        control={control}
                        name="address.streetAddress2Number"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t(
                              'userCreateOrEditView.streetAddress2Number'
                            )}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Controller
                        control={control}
                        name="address.zipCode"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.zipCode')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 8 }}>
                      <Controller
                        control={control}
                        name="address.city"
                        render={({ field, fieldState: { error } }) => (
                          <TextField
                            {...field}
                            value={field.value ?? ''}
                            label={t('userCreateOrEditView.city')}
                            disabled={isDisabled}
                            error={Boolean(error)}
                            helperText={error?.message}
                            fullWidth
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth>
                        <FormLabel>
                          {t('userCreateOrEditView.country')}
                        </FormLabel>

                        <Controller
                          control={control}
                          name="address.country"
                          render={({ field, fieldState: { error } }) => (
                            <Autocomplete
                              options={userCountryNames}
                              value={field.value ?? null}
                              disabled={isDisabled}
                              onChange={(_event, country) =>
                                field.onChange(country ?? '')
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  error={Boolean(error)}
                                  helperText={error?.message}
                                />
                              )}
                            />
                          )}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </PanelStack>

            <PanelStack>
              <Card>
                <CardHeader title={t('userCreateOrEditView.passwordHeader')} />

                <CardContent>
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ marginBottom: 3 }}>
                        <Controller
                          control={control}
                          name="active"
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  {...field}
                                  checked={field.value}
                                  disabled={isDisabled}
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
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <Controller
                        control={control}
                        name="password"
                        render={({ field }) => (
                          <EditUserPassword
                            user={user}
                            password={field.value ?? ''}
                            setPassword={field.onChange}
                            isDisabled={isDisabled || !canResetPassword}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
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
                      <Box sx={{ marginBottom: 3 }}>
                        <Controller
                          control={control}
                          name="properties"
                          render={({ field }) => (
                            <ListInput
                              value={field.value}
                              onChange={field.onChange}
                              defaultValue={{
                                key: '',
                                value: '',
                                public: true,
                              }}
                            >
                              {({ value, onChange }) => (
                                <PropertyRow>
                                  <TextField
                                    placeholder={t('articleEditor.panels.key')}
                                    value={value.key}
                                    onChange={event =>
                                      onChange({
                                        ...value,
                                        key: event.target.value,
                                      })
                                    }
                                    data-testid="propertyKey"
                                  />
                                  <TextField
                                    placeholder={t(
                                      'articleEditor.panels.value'
                                    )}
                                    value={value.value}
                                    onChange={event =>
                                      onChange({
                                        ...value,
                                        value: event.target.value,
                                      })
                                    }
                                    data-testid="propertyValue"
                                  />
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={value.public}
                                        onChange={(_event, isPublic) =>
                                          onChange({
                                            ...value,
                                            public: isPublic,
                                          })
                                        }
                                      />
                                    }
                                    label={t('articleEditor.panels.public')}
                                  />
                                </PropertyRow>
                              )}
                            </ListInput>
                          )}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* roles */}
              <Card>
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
                      <Box sx={{ marginBottom: 3 }}>
                        <Controller
                          control={control}
                          name="roles"
                          render={({ field }) => (
                            <Autocomplete
                              multiple
                              disableCloseOnSelect
                              options={userRoles.map(userRole => userRole.id)}
                              getOptionLabel={id =>
                                userRoles.find(userRole => userRole.id === id)
                                  ?.name ?? id
                              }
                              value={(field.value ?? []).map(role => role.id)}
                              onChange={(_event, value) =>
                                field.onChange(
                                  userRoles.filter(userRole =>
                                    value.includes(userRole.id)
                                  )
                                )
                              }
                              renderInput={params => <TextField {...params} />}
                            />
                          )}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              {/* login code */}
              {user && canManageLoginCodes && (
                <Card>
                  <CardHeader
                    title={t('userCreateOrEditView.loginCode.header')}
                  />

                  <CardContent>
                    <Typography style={{ marginBottom: 12 }}>
                      {loginCodeData?.userLoginCode ?
                        t('userCreateOrEditView.loginCode.status', {
                          usesRemaining:
                            loginCodeData.userLoginCode.usesRemaining,
                          maxUses: loginCodeData.userLoginCode.maxUses,
                          expiresAt: new Date(
                            loginCodeData.userLoginCode.expiresAt
                          ).toLocaleDateString(),
                          lastUsedAt:
                            loginCodeData.userLoginCode.lastUsedAt ?
                              new Date(
                                loginCodeData.userLoginCode.lastUsedAt
                              ).toLocaleString()
                            : t('userCreateOrEditView.loginCode.never'),
                        })
                      : t('userCreateOrEditView.loginCode.none')}
                    </Typography>

                    {loginCodeData?.userLoginCode &&
                      loginCodeData.userLoginCode.secondFactor !==
                        LoginCodeSecondFactor.None && (
                        <Typography style={{ marginBottom: 12 }}>
                          {t(
                            loginCodeData.userLoginCode.secondFactorAvailable ?
                              'userCreateOrEditView.loginCode.secondFactorAvailable'
                            : 'userCreateOrEditView.loginCode.secondFactorMissing',
                            {
                              factor: t(
                                `settingList.loginCodeSecondFactorOptions.${loginCodeData.userLoginCode.secondFactor}`
                              ),
                            }
                          )}
                        </Typography>
                      )}

                    <Stack
                      direction="row"
                      spacing={1}
                      style={{ marginBottom: 16 }}
                    >
                      <Button
                        variant="outlined"
                        disabled={
                          !loginCodeData?.userLoginCode || isRevokingLoginCode
                        }
                        onClick={async () => {
                          await revokeUserLoginCode({
                            variables: { userId: user.id },
                          });
                          setIssuedLoginCode(null);
                          await refetchLoginCode();
                        }}
                      >
                        {t('userCreateOrEditView.loginCode.revoke')}
                      </Button>

                      <Button
                        variant="contained"
                        disabled={isReissuingLoginCode}
                        onClick={async () => {
                          const result = await reissueUserLoginCode({
                            variables: { userId: user.id },
                          });

                          if (result.data?.reissueUserLoginCode) {
                            setIssuedLoginCode({
                              code: result.data.reissueUserLoginCode.code,
                              purl: result.data.reissueUserLoginCode.purl,
                            });
                          }

                          await refetchLoginCode();
                        }}
                      >
                        {t('userCreateOrEditView.loginCode.reissue')}
                      </Button>
                    </Stack>

                    {issuedLoginCode && (
                      <Alert severity="info">
                        {t('userCreateOrEditView.loginCode.issued')}{' '}
                        <strong>{issuedLoginCode.code}</strong>
                        <br />
                        <a href={issuedLoginCode.purl}>
                          {issuedLoginCode.purl}
                        </a>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* two-factor authentication */}
              {user && canResetTotp && (
                <Card>
                  <CardHeader title={t('userCreateOrEditView.totpHeader')} />

                  <CardContent>
                    <Grid
                      container
                      spacing={2}
                    >
                      <Grid size={{ xs: 12 }}>
                        <Typography style={{ marginBottom: 12 }}>
                          {user.totpEnabled ?
                            t('userCreateOrEditView.totpEnabled')
                          : user.totpExempt ?
                            t('userCreateOrEditView.totpExemptInfo')
                          : t('userCreateOrEditView.totpDisabled')}
                        </Typography>

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
                        <Box sx={{ marginBottom: 3 }}>
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
                                    setValue('user', {
                                      ...user,
                                      totpExempt: value,
                                    });
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
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </PanelStack>
          </PageColumns>

          {(subscriptionData?.subscriptions.nodes ||
            (isEditRoute && userId)) && (
            <PanelStack>
              {subscriptionData?.subscriptions.nodes && (
                <Card>
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
                <Card>
                  {/* With letters, the log below holds them too, and the
                      person's delivery channel belongs beside the title. */}
                  <CardHeader
                    title={
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          columnGap: 3,
                          rowGap: 1,
                        }}
                      >
                        {t(
                          paperLetters ?
                            'userMail.titleWithLetters'
                          : 'userMail.title'
                        )}
                        <UserDeliveryChannelControls userId={userId} />
                      </Box>
                    }
                  />
                  <UserDeliveryChannelNotes userId={userId} />

                  <CardContent>
                    <SendMailToUserPanel userId={userId} />
                  </CardContent>

                  <Divider />

                  <CardContent>
                    <UserMailLogPanel userId={userId} />
                  </CardContent>
                </Card>
              )}
            </PanelStack>
          )}
        </UserFormGrid>
      </form>

      {actionMailDialog}

      <Drawer
        anchor="right"
        slotProps={{
          paper: {
            sx: {
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
            setValue('image', image);
            setImageSelectionOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetUser.id,
  CanCreateUser.id,
  CanDeleteUser.id,
  CanGetUsers.id,
  CanResetUserPassword.id,
])(UserEditView);
export { CheckedPermissionComponent as UserEditView };
