import { useApolloClient, useMutation } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  SettingName,
  SettingsListDocument,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
  humanizeError,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  SelectPaywall,
  useAuthorisation,
  useUnsavedChangesDialog,
  enqueueSnackbar,
  PageTitle,
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCancel, MdSave, MdWarning } from 'react-icons/md';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';

const WarningIcon = styled(MdWarning)`
  color: ${({ theme }) => theme.vars.palette.warning.main};
  font-size: 32px;
  margin-left: 20px;
`;

const DescriptionListItemWrapper = styled(DescriptionListItem)`
  min-width: 100px;
`;

type SettingLabelProps = {
  label: string;
  info: string;
};

const SettingLabel = ({ label, info }: SettingLabelProps) => (
  <>
    {label} <InfoTooltip text={info} />
  </>
);

const SETTINGS = {
  [SettingName.AllowGuestCommenting]: {
    label: 'settingList.guestCommenting',
    value: false,
  },
  [SettingName.AllowGuestPollVoting]: {
    label: 'settingList.guestPollVote',
    value: false,
  },
  [SettingName.AllowGuestCommentRating]: {
    label: 'settingList.allowGuestCommentRating',
    value: false,
  },
  [SettingName.SessionTtlDays]: {
    label: 'settingList.sessionTtlDays',
    value: 7,
  },
  [SettingName.EmailQualityUnresponsiveAfterDays]: {
    label: 'settingList.emailQualityUnresponsiveAfterDays',
    value: 180,
  },
  [SettingName.EmailQualityMinMailsForUnresponsive]: {
    label: 'settingList.emailQualityMinMailsForUnresponsive',
    value: 1,
  },
  [SettingName.SendLoginJwtExpiresMin]: {
    label: 'settingList.loginMinutes',
    value: 0,
  },
  [SettingName.ResetPasswordJwtExpiresMin]: {
    label: 'settingList.passwordToken',
    value: 0,
  },
  [SettingName.PeeringTimeoutMs]: {
    label: 'settingList.peerToken',
    value: 0,
  },
  [SettingName.MakeActiveSubscribersApiPublic]: {
    label: 'settingList.activeSubscriptionsApiPublic',
    value: false,
  },
  [SettingName.MakeNewSubscribersApiPublic]: {
    label: 'settingList.newSubscriptionsApiPublic',
    value: false,
  },
  [SettingName.MakeRenewingSubscribersApiPublic]: {
    label: 'settingList.renewingSubscriptionsApiPublic',
    value: false,
  },
  [SettingName.MakeNewDeactivationsApiPublic]: {
    label: 'settingList.newDeactivationsApiPublic',
    value: false,
  },
  [SettingName.MakeExpectedRevenueApiPublic]: {
    label: 'settingList.expectedRevenueApiPublic',
    value: false,
  },
  [SettingName.MakeRevenueApiPublic]: {
    label: 'settingList.revenueApiPublic',
    value: false,
  },
  [SettingName.CommentCharLimit]: {
    label: 'settingList.commentCharLimit',
    value: 0,
  },
  [SettingName.AllowCommentEditing]: {
    label: 'settingList.allowCommentEditing',
    value: false,
  },
  [SettingName.ShowPendingWhenNotPublished]: {
    label: 'settingList.showPendingWhenNotPublished',
    value: false,
  },
  [SettingName.NewArticlePaywall]: {
    label: 'settingList.newArticlePaywall',
    value: null,
  },
  [SettingName.NewArticlePeering]: {
    label: 'settingList.newArticlePeering',
    value: false,
  },
  [SettingName.SubscriptionUpgradeBillsFullDifference]: {
    label: 'settingList.subscriptionUpgradeModel',
    value: false,
  },
} as Record<SettingName, { label: string; value: unknown }>;

type SettingValues = Record<SettingName, unknown>;

const EMPTY_SETTINGS = Object.fromEntries(
  Object.entries(SETTINGS).map(([name, { value }]) => [name, value])
) as SettingValues;

const NUMBER_FALLBACK_RANGES: Partial<Record<SettingName, [number, number]>> = {
  [SettingName.SessionTtlDays]: [1, 365],
  [SettingName.EmailQualityUnresponsiveAfterDays]: [1, 3650],
  [SettingName.EmailQualityMinMailsForUnresponsive]: [1, 100],
  [SettingName.SendLoginJwtExpiresMin]: [1, 10080],
  [SettingName.ResetPasswordJwtExpiresMin]: [10, 10080],
  [SettingName.PeeringTimeoutMs]: [1000, 10000],
  [SettingName.CommentCharLimit]: [0, 10000],
};

type Restrictions = Partial<
  Record<SettingName, { minValue?: number | null; maxValue?: number | null }>
>;

const buildSchema = (restrictions: Restrictions) =>
  z.object(
    Object.fromEntries(
      Object.entries(NUMBER_FALLBACK_RANGES).map(([name, [min, max]]) => {
        const restriction = restrictions[name as SettingName];

        return [
          name,
          z.coerce
            .number()
            .min(restriction?.minValue ?? min)
            .max(restriction?.maxValue ?? max),
        ];
      })
    )
  );

function SettingList() {
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const { t } = useTranslation();
  const client = useApolloClient();

  const isAuthorized = useAuthorisation(CanUpdateSettings.id);
  const [fetchError, setFetchError] = useState<Error>();

  const restrictions = useRef<Restrictions>({});

  const loadSettings = useCallback(async (): Promise<SettingValues> => {
    try {
      const { data } = await client.query({
        query: SettingsListDocument,
        fetchPolicy: 'network-only',
      });

      restrictions.current = Object.fromEntries(
        (data?.settings ?? []).map(setting => [
          setting.name,
          setting.settingRestriction ?? undefined,
        ])
      );

      return {
        ...EMPTY_SETTINGS,
        ...Object.fromEntries(
          (data?.settings ?? []).map(setting => [setting.name, setting.value])
        ),
      } as SettingValues;
    } catch (error) {
      setFetchError(error as Error);

      return EMPTY_SETTINGS;
    }
  }, [client]);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isLoading, dirtyFields, defaultValues },
  } = useForm<SettingValues>({
    resolver: (values, context, options) =>
      zodResolver(buildSchema(restrictions.current))(values, context, options),
    defaultValues: loadSettings,
  });

  const loading = isLoading;
  const isDisabled = loading || !isAuthorized;

  const changedSettings = Object.keys(dirtyFields) as SettingName[];
  const values = useWatch({ control });

  const [updateSetting, { error: updateSettingError }] = useMutation(
    UpdateSettingDocument,
    {}
  );

  useUnsavedChangesDialog(changedSettings.length > 0);

  async function handleSettingListUpdate() {
    setShowWarning(false);

    const batchedUpdates = Object.entries(getValues()).map(([name, value]) =>
      updateSetting({ variables: { name: name as SettingName, value } })
    );

    try {
      await Promise.all(batchedUpdates);
      enqueueSnackbar(t('settingList.successMessage'), {
        variant: 'success',
        title: t('settingList.successTitle'),
        autoHideDuration: 2000,
      });
      reset(await loadSettings());
    } catch (error) {
      enqueueSnackbar(t('toast.updateError'), {
        variant: 'error',
        title: t('settingList.errorTitle'),
        autoHideDuration: 2000,
      });
    }
  }

  useEffect(() => {
    const error = updateSettingError ?? fetchError;

    if (error) {
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        title: t('settingList.errorTitle'),
        autoHideDuration: 2000,
      });
    }
  }, [fetchError, t, updateSettingError]);

  const valueText = useCallback(
    (value: boolean | string): string => {
      if (value === true) {
        return t('settingList.enabled');
      }

      if (value === false) {
        return t('settingList.disabled');
      }

      return value;
    },
    [t]
  );

  const renderToggle = (name: SettingName, info: string) => (
    <Box>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                disabled={isDisabled}
                checked={field.value as boolean}
              />
            }
            label={
              <SettingLabel
                label={t(SETTINGS[name].label)}
                info={info}
              />
            }
          />
        )}
      />
    </Box>
  );

  const renderNumberInput = (
    name: SettingName,
    info: string,
    unit?: string
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          value={field.value as number}
          label={
            <SettingLabel
              label={t(SETTINGS[name].label)}
              info={info}
            />
          }
          type="number"
          disabled={isDisabled}
          onChange={event => field.onChange(+event.target.value)}
          error={Boolean(error)}
          helperText={error?.message}
          fullWidth
          slotProps={{
            input: {
              endAdornment:
                unit ?
                  <InputAdornment position="end">{unit}</InputAdornment>
                : undefined,
            },
          }}
        />
      )}
    />
  );

  if (loading) {
    return;
  }

  return (
    <>
      <form
        data-testid="form"
        onSubmit={handleSubmit(() => setShowWarning(true))}
      >
        <ListViewContainer>
          <ListViewHeader>
            <PageTitle>{t('settingList.settings')}</PageTitle>
          </ListViewHeader>

          <ListViewActions>
            <PermissionControl qualifyingPermissions={[CanUpdateSettings.id]}>
              <Button
                variant="outlined"
                startIcon={<MdCancel />}
                onClick={() => reset()}
                type="reset"
                disabled={isDisabled || !changedSettings.length}
              >
                {t('cancel')}
              </Button>

              <Button
                variant="contained"
                startIcon={<MdSave />}
                type="submit"
                disabled={isDisabled || !changedSettings.length}
              >
                {t('save')}
              </Button>
            </PermissionControl>
          </ListViewActions>
        </ListViewContainer>

        <Grid
          container
          spacing={2}
        >
          <Grid
            container
            spacing={2}
          >
            <Grid size={{ xs: 6 }}>
              <Grid
                container
                spacing={2}
              >
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.comments')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        <FormGroup>
                          {renderToggle(
                            SettingName.AllowGuestCommenting,
                            t('settingList.warnings.guestCommenting')
                          )}

                          {renderToggle(
                            SettingName.AllowGuestCommentRating,
                            t('settingList.warnings.guestCommentRating')
                          )}

                          {renderToggle(
                            SettingName.AllowCommentEditing,
                            t('settingList.info.allowCommentEditing')
                          )}
                        </FormGroup>

                        {/* Comment char limit */}
                        {renderNumberInput(
                          SettingName.CommentCharLimit,
                          t('settingList.info.commentCharLimit')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.polls')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderToggle(
                          SettingName.AllowGuestPollVoting,
                          t('settingList.warnings.guestPollVote')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.memberships')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        <FormGroup>
                          {renderToggle(
                            SettingName.MakeNewSubscribersApiPublic,
                            t('settingList.info.newSubscriptionsApiPublic')
                          )}

                          {renderToggle(
                            SettingName.MakeActiveSubscribersApiPublic,
                            t('settingList.info.activeSubscriptionsApiPublic')
                          )}

                          {renderToggle(
                            SettingName.MakeRenewingSubscribersApiPublic,
                            t('settingList.info.renewingSubscriptionsApiPublic')
                          )}

                          {renderToggle(
                            SettingName.MakeNewDeactivationsApiPublic,
                            t('settingList.info.newDeactivationsApiPublic')
                          )}

                          {renderToggle(
                            SettingName.MakeExpectedRevenueApiPublic,
                            t('settingList.info.expectedRevenueApiPublic')
                          )}

                          {renderToggle(
                            SettingName.MakeRevenueApiPublic,
                            t('settingList.info.revenueApiPublic')
                          )}
                        </FormGroup>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.subscriptionPlans')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderToggle(
                          SettingName.SubscriptionUpgradeBillsFullDifference,
                          t('settingList.warnings.subscriptionUpgradeModel')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Grid
                container
                spacing={2}
              >
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.login')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderNumberInput(
                          SettingName.SessionTtlDays,
                          t('settingList.warnings.sessionTtlDays'),
                          t('settingList.days')
                        )}

                        {renderNumberInput(
                          SettingName.SendLoginJwtExpiresMin,
                          t('settingList.info.loginMinutes'),
                          t('settingList.minutes')
                        )}

                        {renderNumberInput(
                          SettingName.ResetPasswordJwtExpiresMin,
                          t('settingList.info.passwordToken'),
                          t('settingList.minutes')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* email quality: when a mailed address counts as unresponsive */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.emailQuality')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderNumberInput(
                          SettingName.EmailQualityUnresponsiveAfterDays,
                          t(
                            'settingList.warnings.emailQualityUnresponsiveAfterDays'
                          ),
                          t('settingList.days')
                        )}

                        {renderNumberInput(
                          SettingName.EmailQualityMinMailsForUnresponsive,
                          t(
                            'settingList.warnings.emailQualityMinMailsForUnresponsive'
                          )
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.peering')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderNumberInput(
                          SettingName.PeeringTimeoutMs,
                          t('settingList.info.peerToken'),
                          t('settingList.ms')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* articlePage */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardHeader title={t('settingList.articlePage')} />

                    <CardContent>
                      <Stack
                        spacing={3}
                        sx={{ width: '100%' }}
                      >
                        {renderToggle(
                          SettingName.NewArticlePeering,
                          t('settingList.warnings.newArticlePeering')
                        )}

                        <FormControl fullWidth>
                          <FormLabel>
                            <SettingLabel
                              label={t(
                                SETTINGS[SettingName.NewArticlePaywall].label
                              )}
                              info={t('settingList.warnings.newArticlePaywall')}
                            />
                          </FormLabel>

                          <Controller
                            control={control}
                            name={SettingName.NewArticlePaywall}
                            render={({ field }) => (
                              <SelectPaywall
                                disabled={isDisabled}
                                selectedPaywall={field.value as string | null}
                                setSelectedPaywall={field.onChange}
                              />
                            )}
                          />
                        </FormControl>

                        {renderToggle(
                          SettingName.ShowPendingWhenNotPublished,
                          t('settingList.warnings.showPendingWhenNotPublished')
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>

      <Dialog
        fullWidth
        open={showWarning}
        maxWidth="xs"
        onClose={() => setShowWarning(false)}
      >
        <DialogTitle>
          {t('invoice.areYouSure')}
          <WarningIcon />
        </DialogTitle>

        <DialogContent>{t('settingList.warnings.askOperators')}</DialogContent>

        <DialogContent>
          <DescriptionList>
            {changedSettings.map(name => (
              <DescriptionListItemWrapper
                label={t(SETTINGS[name].label)}
                key={name}
              >
                <s>{valueText(defaultValues?.[name] as boolean | string)}</s>{' '}
                {valueText(values[name] as boolean | string)}
              </DescriptionListItemWrapper>
            ))}
          </DescriptionList>
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setShowWarning(false)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={handleSettingListUpdate}
          >
            {t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetSettings.id,
  CanUpdateSettings.id,
])(SettingList);
export { CheckedPermissionComponent as SettingList };
