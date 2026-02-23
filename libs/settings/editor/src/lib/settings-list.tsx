import styled from '@emotion/styled';
import {
  Setting,
  SettingName,
  useSettingsListQuery,
  useUpdateSettingMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  DescriptionList,
  DescriptionListItem,
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
import { MdCancel, MdInfo, MdSave, MdWarning } from 'react-icons/md';
import {
  Button,
  Col,
  Form,
  Grid,
  IconButton,
  InputGroup,
  InputNumber,
  Modal,
  Notification,
  Panel as RPanel,
  Row,
  Schema,
  toaster,
  Toggle,
  Tooltip,
  Whisper,
} from 'rsuite';
import InputGroupAddon from 'rsuite/cjs/InputGroup/InputGroupAddon';
import FormControl from 'rsuite/FormControl';

const Panel = styled(RPanel)`
  margin-bottom: 10px;
`;

const Info = styled.div`
  margin-left: 10px;
  position: relative;
  display: inline-block;
  font-size: 22px;
  color: #3498ff;
`;

const WarningIcon = styled(MdWarning)`
  color: darkorange;
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

type SettingInfoProps = {
  text: string;
};

const SettingInfo = ({ text }: SettingInfoProps) => (
  <Whisper
    trigger="hover"
    speaker={<Tooltip>{text}</Tooltip>}
    placement="top"
  >
    <Info>
      <MdInfo />
    </Info>
  </Whisper>
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
  } = useSettingsListQuery({});

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
  } as Record<SettingName, SettingWithLabel>);

  useEffect(() => {
    settingListData?.settings.forEach(setSetting);
  }, [settingListData]);

  const [updateSetting, { error: updateSettingError }] =
    useUpdateSettingMutation({});

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
          {error.message.toString()}
        </Notification>
      );
  }, [fetchError, t, updateSettingError]);

  const { NumberType } = Schema.Types;

  const validationModel = Schema.Model({
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

  return (
    !loading && (
      <>
        <Form
          data-testId="form"
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
                  className="actionButton"
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
                  className="actionButton"
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
                      <Form.Group controlId={SettingName.AllowGuestCommenting}>
                        <Form.ControlLabel>
                          <>
                            {t(
                              settings[SettingName.AllowGuestCommenting].label
                            )}
                            <SettingInfo
                              text={t('settingList.warnings.guestCommenting')}
                            />
                          </>
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.AllowGuestCommenting].value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[SettingName.AllowGuestCommenting],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>

                      {/* Allow guest rating of a comment */}
                      <Form.Group
                        controlId={SettingName.AllowGuestCommentRating}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.AllowGuestCommentRating].label
                          )}
                          <SettingInfo
                            text={t('settingList.warnings.guestCommentRating')}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.AllowGuestCommentRating].value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[SettingName.AllowGuestCommentRating],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>

                      {/* Allow editing of a comment */}
                      <Form.Group controlId={SettingName.AllowCommentEditing}>
                        <Form.ControlLabel>
                          {t(settings[SettingName.AllowCommentEditing].label)}
                          <SettingInfo
                            text={t('settingList.warnings.allowCommentEditing')}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.AllowCommentEditing].value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[SettingName.AllowCommentEditing],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>

                      {/* Comment char limit */}
                      <Form.Group controlId={SettingName.CommentCharLimit}>
                        <Form.ControlLabel>
                          {t(settings[SettingName.CommentCharLimit].label)}
                          <SettingInfo
                            text={t('settingList.warnings.commentCharLimit')}
                          />
                        </Form.ControlLabel>

                        <InputGroup>
                          <FormControl
                            name={SettingName.CommentCharLimit}
                            accepter={InputNumber}
                            value={settings[SettingName.CommentCharLimit].value}
                            onChange={(value: string) => {
                              setSetting({
                                ...settings[SettingName.CommentCharLimit],
                                value: +value,
                              });
                            }}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Panel>
                  </Col>

                  {/* polls */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={
                        <>
                          {t('settingList.polls')}
                          <SettingInfo
                            text={t('settingList.warnings.guestPollVote')}
                          />
                        </>
                      }
                    >
                      <Form.Group controlId="guestPollVote">
                        <Form.ControlLabel>
                          {t(settings[SettingName.AllowGuestPollVoting].label)}
                        </Form.ControlLabel>
                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.AllowGuestPollVoting].value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[SettingName.AllowGuestPollVoting],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>
                    </Panel>
                  </Col>

                  {/* Memberships */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={t('settingList.memberships')}
                    >
                      <Form.Group
                        controlId={SettingName.MakeNewSubscribersApiPublic}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.MakeNewSubscribersApiPublic]
                              .label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.newSubscriptionsApiPublic'
                            )}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.MakeNewSubscribersApiPublic]
                              .value
                          }
                          onChange={checked => {
                            setSetting({
                              ...settings[
                                SettingName.MakeNewSubscribersApiPublic
                              ],
                              value: checked,
                            });
                          }}
                        />
                      </Form.Group>

                      <Form.Group
                        controlId={SettingName.MakeActiveSubscribersApiPublic}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.MakeActiveSubscribersApiPublic]
                              .label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.activeSubscriptionsApiPublic'
                            )}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.MakeActiveSubscribersApiPublic]
                              .value
                          }
                          onChange={checked => {
                            setSetting({
                              ...settings[
                                SettingName.MakeActiveSubscribersApiPublic
                              ],
                              value: checked,
                            });
                          }}
                        />
                      </Form.Group>

                      <Form.Group
                        controlId={SettingName.MakeRenewingSubscribersApiPublic}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[
                              SettingName.MakeRenewingSubscribersApiPublic
                            ].label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.renewingSubscriptionsApiPublic'
                            )}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[
                              SettingName.MakeRenewingSubscribersApiPublic
                            ].value
                          }
                          onChange={checked => {
                            setSetting({
                              ...settings[
                                SettingName.MakeRenewingSubscribersApiPublic
                              ],
                              value: checked,
                            });
                          }}
                        />
                      </Form.Group>

                      <Form.Group
                        controlId={SettingName.MakeNewDeactivationsApiPublic}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.MakeNewDeactivationsApiPublic]
                              .label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.newDeactivationsApiPublic'
                            )}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.MakeNewDeactivationsApiPublic]
                              .value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[
                                SettingName.MakeNewDeactivationsApiPublic
                              ],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group
                        controlId={SettingName.MakeExpectedRevenueApiPublic}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.MakeExpectedRevenueApiPublic]
                              .label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.expectedRevenueApiPublic'
                            )}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.MakeExpectedRevenueApiPublic]
                              .value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[
                                SettingName.MakeExpectedRevenueApiPublic
                              ],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>

                      <Form.Group controlId={SettingName.MakeRevenueApiPublic}>
                        <Form.ControlLabel>
                          {t(settings[SettingName.MakeRevenueApiPublic].label)}
                          <SettingInfo
                            text={t('settingList.warnings.revenueApiPublic')}
                          />
                        </Form.ControlLabel>

                        <Toggle
                          disabled={isDisabled}
                          checked={
                            settings[SettingName.MakeRevenueApiPublic].value
                          }
                          onChange={checked =>
                            setSetting({
                              ...settings[SettingName.MakeRevenueApiPublic],
                              value: checked,
                            })
                          }
                        />
                      </Form.Group>
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
                      <Form.Group
                        controlId={SettingName.SendLoginJwtExpiresMin}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.SendLoginJwtExpiresMin].label
                          )}
                          <SettingInfo
                            text={t('settingList.warnings.loginMinutes')}
                          />
                        </Form.ControlLabel>

                        <InputGroup>
                          <FormControl
                            name={SettingName.SendLoginJwtExpiresMin}
                            accepter={InputNumber}
                            value={
                              settings[SettingName.SendLoginJwtExpiresMin].value
                            }
                            onChange={(value: string) => {
                              setSetting({
                                ...settings[SettingName.SendLoginJwtExpiresMin],
                                value: +value,
                              });
                            }}
                          />
                          <InputGroupAddon>
                            {t('settingList.minutes')}
                          </InputGroupAddon>
                        </InputGroup>
                      </Form.Group>

                      <Form.Group
                        controlId={SettingName.ResetPasswordJwtExpiresMin}
                      >
                        <Form.ControlLabel>
                          {t(
                            settings[SettingName.ResetPasswordJwtExpiresMin]
                              .label
                          )}
                          <SettingInfo
                            text={t('settingList.warnings.passwordToken')}
                          />
                        </Form.ControlLabel>

                        <InputGroup>
                          <Form.Control
                            name={SettingName.ResetPasswordJwtExpiresMin}
                            accepter={InputNumber}
                            value={
                              settings[SettingName.ResetPasswordJwtExpiresMin]
                                .value
                            }
                            onChange={(value: string) => {
                              setSetting({
                                ...settings[
                                  SettingName.ResetPasswordJwtExpiresMin
                                ],
                                value: +value,
                              });
                            }}
                          />

                          <InputGroupAddon>
                            {t('settingList.minutes')}
                          </InputGroupAddon>
                        </InputGroup>
                      </Form.Group>
                    </Panel>
                  </Col>

                  {/* peering */}
                  <Col xs={24}>
                    <Panel
                      bordered
                      header={
                        <>
                          {t('settingList.peering')}
                          <SettingInfo
                            text={t('settingList.warnings.peerToken')}
                          />
                        </>
                      }
                    >
                      <Form.Group controlId={SettingName.PeeringTimeoutMs}>
                        <Form.ControlLabel>
                          {t(settings[SettingName.PeeringTimeoutMs].label)}
                        </Form.ControlLabel>
                        <InputGroup>
                          <Form.Control
                            name={SettingName.PeeringTimeoutMs}
                            accepter={InputNumber}
                            value={settings[SettingName.PeeringTimeoutMs].value}
                            onChange={(value: string) => {
                              setSetting({
                                ...settings[SettingName.PeeringTimeoutMs],
                                value: +value,
                              });
                            }}
                          />
                          <InputGroupAddon>
                            {t('settingList.ms')}
                          </InputGroupAddon>
                        </InputGroup>
                      </Form.Group>
                    </Panel>
                  </Col>
                </Row>

                {/* articlePage */}
                <Col xs={24}>
                  <Panel
                    bordered
                    header={t('settingList.articlePage')}
                  >
                    <Form.Group controlId={SettingName.NewArticlePeering}>
                      <Form.ControlLabel>
                        <>
                          {t(settings[SettingName.NewArticlePeering].label)}
                          <SettingInfo
                            text={t('settingList.warnings.newArticlePeering')}
                          />
                        </>
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.NewArticlePeering].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.NewArticlePeering],
                            value: checked,
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.NewArticlePaywall}>
                      <Form.ControlLabel>
                        <>
                          {t(settings[SettingName.NewArticlePaywall].label)}
                          <SettingInfo
                            text={t('settingList.warnings.newArticlePaywall')}
                          />
                        </>
                      </Form.ControlLabel>

                      <SelectPaywall
                        disabled={isDisabled}
                        selectedPaywall={
                          settings[SettingName.NewArticlePaywall].value
                        }
                        setSelectedPaywall={paywall =>
                          setSetting({
                            ...settings[SettingName.NewArticlePaywall],
                            value: paywall,
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group
                      controlId={SettingName.ShowPendingWhenNotPublished}
                    >
                      <Form.ControlLabel>
                        <>
                          {t(
                            settings[SettingName.ShowPendingWhenNotPublished]
                              .label
                          )}
                          <SettingInfo
                            text={t(
                              'settingList.warnings.showPendingWhenNotPublished'
                            )}
                          />
                        </>
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={
                          settings[SettingName.ShowPendingWhenNotPublished]
                            .value
                        }
                        onChange={checked =>
                          setSetting({
                            ...settings[
                              SettingName.ShowPendingWhenNotPublished
                            ],
                            value: checked,
                          })
                        }
                      />
                    </Form.Group>
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
                  <s>{valueText(setting.value)}</s>{' '}
                  {valueText(settings[setting.name].value)}
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
