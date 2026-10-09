import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Setting,
  SettingName,
  LoginCodeSecondFactor,
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
} from '@wepublish/ui/editor';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCancel, MdSave, MdWarning } from 'react-icons/md';
import {
  Button,
  Col,
  Form,
  Grid,
  IconButton,
  Input,
  InputGroup,
  NumberInput,
  Modal,
  Notification,
  Panel as RPanel,
  Row,
  Schema,
  SelectPicker,
  toaster,
  Toggle,
} from 'rsuite';
import InputGroupAddon from 'rsuite/cjs/InputGroup/InputGroupAddon';

const Panel = styled(RPanel)`
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
    [SettingName.LoginCodeEnabled]: {
      value: false,
      name: SettingName.LoginCodeEnabled,
      label: 'settingList.loginCodeEnabled',
    },
    [SettingName.LoginCodeMaxUses]: {
      value: 0,
      name: SettingName.LoginCodeMaxUses,
      label: 'settingList.loginCodeMaxUses',
    },
    [SettingName.LoginCodeValidDays]: {
      value: 0,
      name: SettingName.LoginCodeValidDays,
      label: 'settingList.loginCodeValidDays',
    },
    [SettingName.LoginCodeSecondFactor]: {
      value: LoginCodeSecondFactor.None,
      name: SettingName.LoginCodeSecondFactor,
      label: 'settingList.loginCodeSecondFactor',
    },
    [SettingName.PlaceholderEmailPatterns]: {
      value: '',
      name: SettingName.PlaceholderEmailPatterns,
      label: 'settingList.placeholderEmailPatterns',
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
      toaster.push(
        <Notification
          header={t('settingList.successTitle')}
          type="success"
          duration={2000}
        >
          {t('settingList.successMessage')}
        </Notification>
      );
      await refetch();
    } catch (error) {
      toaster.push(
        <Notification
          type="error"
          header={t('settingList.errorTitle')}
          duration={2000}
        >
          {t('toast.updateError')}
        </Notification>
      );
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
      toaster.push(
        <Notification
          type="error"
          header={t('settingList.errorTitle')}
          duration={2000}
        >
          {humanizeError(error)}
        </Notification>
      );
  }, [fetchError, t, updateSettingError]);

  const { NumberType } = Schema.Types;

  const validationModel = Schema.Model({
    [SettingName.LoginCodeMaxUses]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.LoginCodeMaxUses].settingRestriction?.minValue ??
          1,
        settings[SettingName.LoginCodeMaxUses].settingRestriction?.maxValue ??
          100,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.LoginCodeMaxUses].settingRestriction
              ?.minValue ?? 1,
          max:
            settings[SettingName.LoginCodeMaxUses].settingRestriction
              ?.maxValue ?? 100,
        })
      ),
    [SettingName.LoginCodeValidDays]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.LoginCodeValidDays].settingRestriction?.minValue ??
          1,
        settings[SettingName.LoginCodeValidDays].settingRestriction?.maxValue ??
          365,
        t('errorMessages.invalidRange', {
          min:
            settings[SettingName.LoginCodeValidDays].settingRestriction
              ?.minValue ?? 1,
          max:
            settings[SettingName.LoginCodeValidDays].settingRestriction
              ?.maxValue ?? 365,
        })
      ),
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
      <Toggle
        disabled={isDisabled}
        checked={settings[name].value as boolean}
        onChange={checked =>
          setSetting({
            ...settings[name],
            value: checked,
          })
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
                <IconButton
                  icon={<MdCancel />}
                  onClick={() => handleCancel()}
                  type="reset"
                  size="lg"
                  appearance="default"
                  disabled={isDisabled || changedSetting.length === 0}
                >
                  {t('cancel')}
                </IconButton>
                {/* save btn */}
                <IconButton
                  icon={<MdSave />}
                  type="submit"
                  size="lg"
                  appearance="primary"
                  disabled={isDisabled || changedSetting.length === 0}
                >
                  {t('save')}
                </IconButton>
              </PermissionControl>
            </ListViewActions>
          </ListViewContainer>

          <Grid fluid>
            <Row>
              {/* first column */}
              <Col xs={12}>
                <Row>
                  {/* comments */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.comments')}
                    >
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
                    </Panel>
                  </Col>

                  {/* polls */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.polls')}
                    >
                      <Form.Stack fluid>
                        {renderToggle(
                          SettingName.AllowGuestPollVoting,
                          t('settingList.warnings.guestPollVote')
                        )}
                      </Form.Stack>
                    </Panel>
                  </Col>

                  {/* Memberships */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.memberships')}
                    >
                      <Form.Stack fluid>
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
                      </Form.Stack>
                    </Panel>
                  </Col>

                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.subscriptionPlans')}
                    >
                      <Form.Stack fluid>
                        {renderToggle(
                          SettingName.SubscriptionUpgradeBillsFullDifference,
                          t('settingList.warnings.subscriptionUpgradeModel')
                        )}
                      </Form.Stack>
                    </Panel>
                  </Col>
                </Row>
              </Col>

              {/* second column */}
              <Col xs={12}>
                <Row>
                  {/* login */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.login')}
                    >
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

                        {renderToggle(
                          SettingName.LoginCodeEnabled,
                          t('settingList.warnings.loginCodeEnabled')
                        )}

                        {renderNumberInput(
                          SettingName.LoginCodeMaxUses,
                          t('settingList.warnings.loginCodeMaxUses'),
                          t('settingList.loginCodeUses')
                        )}

                        {renderNumberInput(
                          SettingName.LoginCodeValidDays,
                          t('settingList.warnings.loginCodeValidDays'),
                          t('settingList.days')
                        )}

                        <Form.Group
                          controlId={SettingName.LoginCodeSecondFactor}
                        >
                          <Form.Label>
                            <SettingLabel
                              label={t(
                                settings[SettingName.LoginCodeSecondFactor]
                                  .label
                              )}
                              info={t(
                                'settingList.warnings.loginCodeSecondFactor'
                              )}
                            />
                          </Form.Label>

                          <Form.Control
                            name={SettingName.LoginCodeSecondFactor}
                            accepter={SelectPicker}
                            searchable={false}
                            cleanable={false}
                            block
                            data={Object.values(LoginCodeSecondFactor).map(
                              value => ({
                                value,
                                label: t(
                                  `settingList.loginCodeSecondFactorOptions.${value}`
                                ),
                              })
                            )}
                            value={
                              settings[SettingName.LoginCodeSecondFactor].value
                            }
                            onChange={(value: unknown) => {
                              setSetting({
                                ...settings[SettingName.LoginCodeSecondFactor],
                                value:
                                  (value as LoginCodeSecondFactor | null) ??
                                  LoginCodeSecondFactor.None,
                              });
                            }}
                          />
                        </Form.Group>

                        <Form.Group
                          controlId={SettingName.PlaceholderEmailPatterns}
                        >
                          <Form.Label>
                            <SettingLabel
                              label={t(
                                settings[SettingName.PlaceholderEmailPatterns]
                                  .label
                              )}
                              info={t(
                                'settingList.warnings.placeholderEmailPatterns'
                              )}
                            />
                          </Form.Label>

                          <Form.Control
                            name={SettingName.PlaceholderEmailPatterns}
                            accepter={Input}
                            value={
                              settings[SettingName.PlaceholderEmailPatterns]
                                .value ?? ''
                            }
                            onChange={(value: string) => {
                              setSetting({
                                ...settings[
                                  SettingName.PlaceholderEmailPatterns
                                ],
                                value,
                              });
                            }}
                          />
                        </Form.Group>

                        {renderNumberInput(
                          SettingName.ResetPasswordJwtExpiresMin,
                          t('settingList.info.passwordToken'),
                          t('settingList.minutes')
                        )}
                      </Form.Stack>
                    </Panel>
                  </Col>

                  {/* peering */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.peering')}
                    >
                      <Form.Stack fluid>
                        {renderNumberInput(
                          SettingName.PeeringTimeoutMs,
                          t('settingList.info.peerToken'),
                          t('settingList.ms')
                        )}
                      </Form.Stack>
                    </Panel>
                  </Col>
                </Row>

                {/* articlePage */}
                <Col xs={24}>
                  <Panel
                    bordered
                    header={t('settingList.articlePage')}
                  >
                    <Form.Stack fluid>
                      {renderToggle(
                        SettingName.NewArticlePeering,
                        t('settingList.warnings.newArticlePeering')
                      )}

                      <Form.Group controlId={SettingName.NewArticlePaywall}>
                        <Form.Label>
                          <SettingLabel
                            label={t(
                              settings[SettingName.NewArticlePaywall].label
                            )}
                            info={t('settingList.warnings.newArticlePaywall')}
                          />
                        </Form.Label>

                        <SelectPaywall
                          disabled={isDisabled}
                          selectedPaywall={
                            settings[SettingName.NewArticlePaywall].value as
                              | string
                              | null
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
                        t('settingList.warnings.showPendingWhenNotPublished')
                      )}
                    </Form.Stack>
                  </Panel>
                </Col>
              </Col>
            </Row>
          </Grid>
        </Form>

        <Modal
          open={showWarning}
          backdrop="static"
          size="xs"
          onClose={() => setShowWarning(false)}
        >
          <Modal.Title>
            {t('invoice.areYouSure')}
            <WarningIcon />
          </Modal.Title>

          <Modal.Body>{t('settingList.warnings.askOperators')}</Modal.Body>
          <Modal.Body>
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
          </Modal.Body>

          <Modal.Footer>
            <Button
              appearance="primary"
              onClick={handleSettingListUpdate}
            >
              {t('confirm')}
            </Button>

            <Button
              appearance="subtle"
              onClick={() => setShowWarning(false)}
            >
              {t('cancel')}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    )
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
  'CAN_UPDATE_SETTINGS',
])(SettingList);
export { CheckedPermissionComponent as SettingList };
