import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Setting,
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
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCancel, MdSave, MdWarning } from 'react-icons/md';
import { Form, InputGroup, NumberInput, Schema } from 'rsuite';
import InputGroupAddon from 'rsuite/cjs/InputGroup/InputGroupAddon';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Card as MuiCard,
  Grid,
} from '@mui/material';

const Panel = styled(MuiCard)`
  margin-bottom: 16px;
`;

const WarningIcon = styled(MdWarning)`
  color: var(--rs-state-warning);
  font-size: 32px;
  margin-left: 20px;
`;

const DescriptionListItemWrapper = styled(DescriptionListItem)`
  min-width: 100px;
`;

const WideInputGroup = styled(InputGroup)`
  &&& {
    width: 100%;
  }
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

interface Label {
  label: string;
}

type SettingWithLabel = Label & Setting;

function settingsReducer(
  settings: Record<SettingName, SettingWithLabel>,
  changedSetting: Setting
) {
  return {
    ...settings,
    [changedSetting.name]: {
      ...settings[changedSetting.name],
      value: changedSetting.value,
    },
  };
}

function SettingList() {
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const { t } = useTranslation();

  const isAuthorized = useAuthorisation('CAN_UPDATE_SETTINGS');

  const {
    data: settingListData,
    loading,
    refetch,
    error: fetchError,
  } = useQuery(SettingsListDocument, {});

  const isDisabled = loading || !settingListData || !isAuthorized;

  const [settings, setSetting] = useReducer(settingsReducer, {
    [SettingName.AllowGuestCommenting]: {
      value: false,
      name: SettingName.AllowGuestCommenting,
      label: 'settingList.guestCommenting',
    },
    [SettingName.AllowGuestPollVoting]: {
      value: false,
      name: SettingName.AllowGuestPollVoting,
      label: 'settingList.guestPollVote',
    },
    [SettingName.AllowGuestCommentRating]: {
      value: false,
      name: SettingName.AllowGuestCommentRating,
      label: 'settingList.allowGuestCommentRating',
    },
    [SettingName.SessionTtlDays]: {
      value: 7,
      name: SettingName.SessionTtlDays,
      label: 'settingList.sessionTtlDays',
    },
    [SettingName.SendLoginJwtExpiresMin]: {
      value: 0,
      name: SettingName.SendLoginJwtExpiresMin,
      label: 'settingList.loginMinutes',
    },
    [SettingName.ResetPasswordJwtExpiresMin]: {
      value: 0,
      name: SettingName.ResetPasswordJwtExpiresMin,
      label: 'settingList.passwordToken',
    },
    [SettingName.PeeringTimeoutMs]: {
      value: 0,
      name: SettingName.PeeringTimeoutMs,
      label: 'settingList.peerToken',
    },
    [SettingName.MakeActiveSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeActiveSubscribersApiPublic,
      label: 'settingList.activeSubscriptionsApiPublic',
    },
    [SettingName.MakeNewSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeNewSubscribersApiPublic,
      label: 'settingList.newSubscriptionsApiPublic',
    },
    [SettingName.MakeRenewingSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeRenewingSubscribersApiPublic,
      label: 'settingList.renewingSubscriptionsApiPublic',
    },
    [SettingName.MakeNewDeactivationsApiPublic]: {
      value: false,
      name: SettingName.MakeNewDeactivationsApiPublic,
      label: 'settingList.newDeactivationsApiPublic',
    },
    [SettingName.MakeExpectedRevenueApiPublic]: {
      value: false,
      name: SettingName.MakeExpectedRevenueApiPublic,
      label: 'settingList.expectedRevenueApiPublic',
    },
    [SettingName.MakeRevenueApiPublic]: {
      value: false,
      name: SettingName.MakeRevenueApiPublic,
      label: 'settingList.revenueApiPublic',
    },
    [SettingName.CommentCharLimit]: {
      value: 0,
      name: SettingName.CommentCharLimit,
      label: 'settingList.commentCharLimit',
    },
    [SettingName.AllowCommentEditing]: {
      value: false,
      name: SettingName.AllowCommentEditing,
      label: 'settingList.allowCommentEditing',
    },
    [SettingName.ShowPendingWhenNotPublished]: {
      value: false,
      name: SettingName.ShowPendingWhenNotPublished,
      label: 'settingList.showPendingWhenNotPublished',
    },
    [SettingName.NewArticlePaywall]: {
      value: null,
      name: SettingName.NewArticlePaywall,
      label: 'settingList.newArticlePaywall',
    },
    [SettingName.NewArticlePeering]: {
      value: false,
      name: SettingName.NewArticlePeering,
      label: 'settingList.newArticlePeering',
    },
    [SettingName.SubscriptionUpgradeBillsFullDifference]: {
      value: false,
      name: SettingName.SubscriptionUpgradeBillsFullDifference,
      label: 'settingList.subscriptionUpgradeModel',
    },
  } as Record<SettingName, SettingWithLabel>);

  useEffect(() => {
    settingListData?.settings.forEach(setSetting);
  }, [settingListData]);

  const [updateSetting, { error: updateSettingError }] = useMutation(
    UpdateSettingDocument,
    {}
  );

  const [changedSetting, setChangedSetting] = useState(
    settingListData?.settings.filter(
      setting => setting.value !== settings[setting.name].value
    ) ?? []
  );
  useUnsavedChangesDialog(changedSetting.length > 0);

  async function handleSettingListUpdate() {
    setShowWarning(false);

    const batchedUpdates = Object.values(settings).map(({ name, value }) => {
      return updateSetting({ variables: { name, value } });
    });

    try {
      await Promise.all(batchedUpdates);
      enqueueSnackbar(t('settingList.successMessage'), {
        variant: 'success',
        title: t('settingList.successTitle'),
        autoHideDuration: 2000,
      });
      await refetch();
    } catch (error) {
      enqueueSnackbar(t('toast.updateError'), {
        variant: 'error',
        title: t('settingList.errorTitle'),
        autoHideDuration: 2000,
      });
    }
  }

  useEffect(() => {
    setChangedSetting(
      settingListData?.settings.filter(
        setting => setting.value !== settings[setting.name].value
      ) ?? []
    );
  }, [settingListData, settings]);

  async function handleCancel() {
    settingListData?.settings.forEach(setSetting);
  }

  useEffect(() => {
    const error = updateSettingError ?? fetchError;

    if (error)
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        title: t('settingList.errorTitle'),
        autoHideDuration: 2000,
      });
  }, [fetchError, t, updateSettingError]);

  const { NumberType } = Schema.Types;

  const validationModel = Schema.Model({
    [SettingName.SessionTtlDays]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.SessionTtlDays].settingRestriction?.minValue ?? 1,
        settings[SettingName.SessionTtlDays].settingRestriction?.maxValue ??
          365,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.SessionTtlDays].settingRestriction?.minValue ??
            1,
          max:
            settings[SettingName.SessionTtlDays].settingRestriction?.maxValue ??
            365,
        })
      ),
    [SettingName.SendLoginJwtExpiresMin]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.SendLoginJwtExpiresMin].settingRestriction
          ?.minValue ?? 1,
        settings[SettingName.SendLoginJwtExpiresMin].settingRestriction
          ?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.SendLoginJwtExpiresMin].settingRestriction
              ?.minValue ?? 1,
          max:
            settings[SettingName.SendLoginJwtExpiresMin].settingRestriction
              ?.maxValue ?? 10080,
        })
      ),
    [SettingName.ResetPasswordJwtExpiresMin]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction
          ?.minValue ?? 10,
        settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction
          ?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction
              ?.minValue ?? 10,
          max:
            settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction
              ?.maxValue ?? 10080,
        })
      ),
    [SettingName.PeeringTimeoutMs]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.PeeringTimeoutMs].settingRestriction?.minValue ??
          1000,
        settings[SettingName.PeeringTimeoutMs].settingRestriction?.maxValue ??
          10000,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.PeeringTimeoutMs].settingRestriction
              ?.minValue ?? 1000,
          max:
            settings[SettingName.PeeringTimeoutMs].settingRestriction
              ?.maxValue ?? 10000,
        })
      ),
    [SettingName.CommentCharLimit]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.CommentCharLimit].settingRestriction?.minValue ??
          0,
        settings[SettingName.CommentCharLimit].settingRestriction?.maxValue ??
          10000,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.CommentCharLimit].settingRestriction
              ?.minValue ?? 0,
          max:
            settings[SettingName.CommentCharLimit].settingRestriction
              ?.maxValue ?? 10000,
        })
      ),
  });

  const formValue = Object.values(settings).reduce(
    (values, setting) => ({
      ...values,
      [setting.name]: setting.value,
    }),
    {} as Record<SettingName, unknown>
  );

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
    <Form.Group controlId={name}>
      <FormControlLabel
        control={
          <Switch
            disabled={isDisabled}
            checked={settings[name].value as boolean}
            onChange={(_event, checked) =>
              setSetting({
                ...settings[name],
                value: checked,
              })
            }
          />
        }
        label={
          <SettingLabel
            label={t(settings[name].label)}
            info={info}
          />
        }
      />
    </Form.Group>
  );

  const renderNumberInput = (
    name: SettingName,
    info: string,
    unit?: string
  ) => (
    <Form.Group controlId={name}>
      <Form.Label>
        <SettingLabel
          label={t(settings[name].label)}
          info={info}
        />
      </Form.Label>

      <InputGroup>
        <Form.Control
          name={name}
          accepter={NumberInput}
          value={settings[name].value}
          onChange={(value: string) => {
            setSetting({
              ...settings[name],
              value: +value,
            });
          }}
        />

        {unit && <InputGroupAddon>{unit}</InputGroupAddon>}
      </InputGroup>
    </Form.Group>
  );

  return (
    !loading && (
      <>
        <Form
          data-testid="form"
          disabled={isDisabled}
          model={validationModel}
          formValue={formValue}
          onSubmit={validationPassed => {
            return validationPassed && setShowWarning(true);
          }}
        >
          <ListViewContainer>
            <ListViewHeader>
              <h2>{t('settingList.settings')}</h2>
            </ListViewHeader>
            <ListViewActions>
              <PermissionControl
                qualifyingPermissions={['CAN_UPDATE_SETTINGS']}
              >
                {/* cancel btn */}
                <Button
                  variant="outlined"
                  startIcon={<MdCancel />}
                  onClick={() => handleCancel()}
                  type="reset"
                  size="large"
                  disabled={isDisabled || changedSetting.length === 0}
                >
                  {t('cancel')}
                </Button>
                {/* save btn */}
                <Button
                  variant="contained"
                  startIcon={<MdSave />}
                  type="submit"
                  size="large"
                  disabled={isDisabled || changedSetting.length === 0}
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
              {/* first column */}
              <Grid size={{ xs: 6 }}>
                <Grid
                  container
                  spacing={2}
                >
                  {/* comments */}
                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader title={t('settingList.comments')} />

                          <CardContent>
                            <Form.Stack fluid>
                              {renderToggle(
                                SettingName.AllowGuestCommenting,
                                t('settingList.warnings.guestCommenting')
                              )}

                              {/* Allow guest rating of a comment */}
                              {renderToggle(
                                SettingName.AllowGuestCommentRating,
                                t('settingList.warnings.guestCommentRating')
                              )}

                              {/* Allow editing of a comment */}
                              {renderToggle(
                                SettingName.AllowCommentEditing,
                                t('settingList.info.allowCommentEditing')
                              )}

                              {/* Comment char limit */}
                              {renderNumberInput(
                                SettingName.CommentCharLimit,
                                t('settingList.info.commentCharLimit')
                              )}
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>

                  {/* polls */}
                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader title={t('settingList.polls')} />

                          <CardContent>
                            <Form.Stack fluid>
                              {renderToggle(
                                SettingName.AllowGuestPollVoting,
                                t('settingList.warnings.guestPollVote')
                              )}
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>

                  {/* Memberships */}
                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader title={t('settingList.memberships')} />

                          <CardContent>
                            <Form.Stack fluid>
                              {renderToggle(
                                SettingName.MakeNewSubscribersApiPublic,
                                t('settingList.info.newSubscriptionsApiPublic')
                              )}

                              {renderToggle(
                                SettingName.MakeActiveSubscribersApiPublic,
                                t(
                                  'settingList.info.activeSubscriptionsApiPublic'
                                )
                              )}

                              {renderToggle(
                                SettingName.MakeRenewingSubscribersApiPublic,
                                t(
                                  'settingList.info.renewingSubscriptionsApiPublic'
                                )
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
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader
                            title={t('settingList.subscriptionPlans')}
                          />

                          <CardContent>
                            <Form.Stack fluid>
                              {renderToggle(
                                SettingName.SubscriptionUpgradeBillsFullDifference,
                                t(
                                  'settingList.warnings.subscriptionUpgradeModel'
                                )
                              )}
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>
                </Grid>
              </Grid>

              {/* second column */}
              <Grid size={{ xs: 6 }}>
                <Grid
                  container
                  spacing={2}
                >
                  {/* login */}
                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader title={t('settingList.login')} />

                          <CardContent>
                            <Form.Stack fluid>
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
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>

                  {/* peering */}
                  <Grid size={{ xs: 12 }}>
                    <Panel>
                      <CardContent>
                        <CardContent>
                          <CardHeader title={t('settingList.peering')} />

                          <CardContent>
                            <Form.Stack fluid>
                              {renderNumberInput(
                                SettingName.PeeringTimeoutMs,
                                t('settingList.info.peerToken'),
                                t('settingList.ms')
                              )}
                            </Form.Stack>
                          </CardContent>
                        </CardContent>
                      </CardContent>
                    </Panel>
                  </Grid>
                </Grid>

                {/* articlePage */}
                <Grid size={{ xs: 12 }}>
                  <Panel>
                    <CardContent>
                      <CardContent>
                        <CardHeader title={t('settingList.articlePage')} />

                        <CardContent>
                          <Form.Stack fluid>
                            {renderToggle(
                              SettingName.NewArticlePeering,
                              t('settingList.warnings.newArticlePeering')
                            )}

                            <Form.Group
                              controlId={SettingName.NewArticlePaywall}
                            >
                              <Form.Label>
                                <SettingLabel
                                  label={t(
                                    settings[SettingName.NewArticlePaywall]
                                      .label
                                  )}
                                  info={t(
                                    'settingList.warnings.newArticlePaywall'
                                  )}
                                />
                              </Form.Label>

                              <SelectPaywall
                                disabled={isDisabled}
                                selectedPaywall={
                                  settings[SettingName.NewArticlePaywall]
                                    .value as string | null
                                }
                                setSelectedPaywall={paywall =>
                                  setSetting({
                                    ...settings[SettingName.NewArticlePaywall],
                                    value: paywall,
                                  })
                                }
                              />
                            </Form.Group>

                            {renderToggle(
                              SettingName.ShowPendingWhenNotPublished,
                              t(
                                'settingList.warnings.showPendingWhenNotPublished'
                              )
                            )}
                          </Form.Stack>
                        </CardContent>
                      </CardContent>
                    </CardContent>
                  </Panel>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Form>

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

          <DialogContent>
            {t('settingList.warnings.askOperators')}
          </DialogContent>
          <DialogContent>
            <DescriptionList>
              {changedSetting.map(setting => (
                <DescriptionListItemWrapper
                  label={t(settings[setting.name].label)}
                  key={setting.name}
                >
                  <s>{valueText(setting.value as boolean | string)}</s>{' '}
                  {valueText(settings[setting.name].value as boolean | string)}
                </DescriptionListItemWrapper>
              ))}
            </DescriptionList>
          </DialogContent>

          <DialogActions>
            <Button
              variant="contained"
              onClick={handleSettingListUpdate}
            >
              {t('confirm')}
            </Button>

            <Button
              variant="text"
              onClick={() => setShowWarning(false)}
            >
              {t('cancel')}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
  'CAN_UPDATE_SETTINGS',
])(SettingList);
export { CheckedPermissionComponent as SettingList };
