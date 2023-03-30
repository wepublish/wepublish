import styled from '@emotion/styled'
import {
  Setting,
  SettingName,
  useSettingListQuery,
  useUpdateSettingListMutation
} from '@wepublish/editor/api'
import {useEffect, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdInfo, MdWarning} from 'react-icons/md'
import {
  Button,
  Col,
  Form,
  Grid,
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
  Whisper
} from 'rsuite'
import InputGroupAddon from 'rsuite/cjs/InputGroup/InputGroupAddon'
import FormControl from 'rsuite/FormControl'

import {
  createCheckedPermissionComponent,
  PermissionControl,
  useAuthorisation
} from '../atoms/permissionControl'

const Panel = styled(RPanel)`
  margin-bottom: 10px;
`

const Info = styled.div`
  margin-left: 10px;
  position: relative;
  display: inline-block;
  font-size: 22px;
  color: #3498ff;
`

const WarningIcon = styled(MdWarning)`
  color: darkorange;
  font-size: 32px;
  margin-left: 20px;
`

type SettingInfoProps = {
  text: string
}

const SettingInfo = ({text}: SettingInfoProps) => (
  <Whisper trigger="hover" speaker={<Tooltip>{text}</Tooltip>} placement="top">
    <Info>
      <MdInfo />
    </Info>
  </Whisper>
)

function settingsReducer(settings: Record<SettingName, Setting>, changedSetting: Setting) {
  return {...settings, [changedSetting.name]: changedSetting}
}

function SettingList() {
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const {t} = useTranslation()

  const isAuthorized = useAuthorisation('CAN_UPDATE_SETTINGS')

  const {
    data: settingListData,
    loading,
    refetch,
    error: fetchError
  } = useSettingListQuery({
    fetchPolicy: 'network-only'
  })

  const isDisabled = loading || !settingListData || !isAuthorized

  const [settings, setSetting] = useReducer(settingsReducer, {
    [SettingName.AllowGuestCommenting]: {
      value: false,
      name: SettingName.AllowGuestCommenting
    },
    [SettingName.AllowGuestPollVoting]: {
      value: false,
      name: SettingName.AllowGuestPollVoting
    },
    [SettingName.AllowGuestCommentRating]: {
      value: false,
      name: SettingName.AllowGuestCommentRating
    },
    [SettingName.SendLoginJwtExpiresMin]: {
      value: 0,
      name: SettingName.SendLoginJwtExpiresMin
    },
    [SettingName.ResetPasswordJwtExpiresMin]: {
      value: 0,
      name: SettingName.ResetPasswordJwtExpiresMin
    },
    [SettingName.PeeringTimeoutMs]: {
      value: 0,
      name: SettingName.PeeringTimeoutMs
    },
    [SettingName.PeeringTimeoutMs]: {
      value: 0,
      name: SettingName.PeeringTimeoutMs
    },
    [SettingName.InvoiceReminderFreq]: {
      value: 0,
      name: SettingName.InvoiceReminderFreq
    },
    [SettingName.InvoiceReminderMaxTries]: {
      value: 0,
      name: SettingName.InvoiceReminderMaxTries
    },
    [SettingName.MakeActiveSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeActiveSubscribersApiPublic
    },
    [SettingName.MakeNewSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeNewSubscribersApiPublic
    },
    [SettingName.MakeRenewingSubscribersApiPublic]: {
      value: false,
      name: SettingName.MakeRenewingSubscribersApiPublic
    },
    [SettingName.MakeNewDeactivationsApiPublic]: {
      value: false,
      name: SettingName.MakeNewDeactivationsApiPublic
    },
    [SettingName.MakeExpectedRevenueApiPublic]: {
      value: false,
      name: SettingName.MakeExpectedRevenueApiPublic
    },
    [SettingName.MakeRevenueApiPublic]: {
      value: false,
      name: SettingName.MakeRevenueApiPublic
    }
  } as Record<SettingName, Setting>)

  useEffect(() => {
    settingListData?.settings.forEach(setSetting)
  }, [settingListData])

  const [updateSettings, {error: updateSettingError}] = useUpdateSettingListMutation({
    fetchPolicy: 'network-only'
  })

  async function handleSettingListUpdate() {
    setShowWarning(false)
    await updateSettings({
      variables: {input: Object.values(settings).map(({name, value}) => ({name, value}))}
    })

    toaster.push(
      <Notification header={t('settingList.successTitle')} type="success" duration={2000}>
        {t('settingList.successMessage')}
      </Notification>
    )
    await refetch()
  }

  useEffect(() => {
    const error = updateSettingError ?? fetchError
    if (error)
      toaster.push(
        <Notification type="error" header={t('settingList.errorTitle')} duration={2000}>
          {error.message.toString()}
        </Notification>
      )
  }, [fetchError, t, updateSettingError])

  const {NumberType} = Schema.Types

  const validationModel = Schema.Model({
    [SettingName.SendLoginJwtExpiresMin]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.SendLoginJwtExpiresMin].settingRestriction?.minValue ?? 1,
        settings[SettingName.SendLoginJwtExpiresMin].settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: settings[SettingName.SendLoginJwtExpiresMin].settingRestriction?.minValue ?? 1,
          max: settings[SettingName.SendLoginJwtExpiresMin].settingRestriction?.maxValue ?? 10080
        })
      ),
    [SettingName.ResetPasswordJwtExpiresMin]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction?.minValue ?? 10,
        settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction?.minValue ?? 10,
          max:
            settings[SettingName.ResetPasswordJwtExpiresMin].settingRestriction?.maxValue ?? 10080
        })
      ),
    [SettingName.PeeringTimeoutMs]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.PeeringTimeoutMs].settingRestriction?.minValue ?? 1000,
        settings[SettingName.PeeringTimeoutMs].settingRestriction?.maxValue ?? 10000,
        t('errorMessages.invalidRange', {
          min: settings[SettingName.PeeringTimeoutMs].settingRestriction?.minValue ?? 1000,
          max: settings[SettingName.PeeringTimeoutMs].settingRestriction?.maxValue ?? 10000
        })
      ),
    [SettingName.InvoiceReminderMaxTries]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.InvoiceReminderMaxTries].settingRestriction?.minValue ?? 0,
        settings[SettingName.InvoiceReminderMaxTries].settingRestriction?.maxValue ?? 10,
        t('errorMessages.invalidRange', {
          min: settings[SettingName.InvoiceReminderMaxTries].settingRestriction?.minValue ?? 0,
          max: settings[SettingName.InvoiceReminderMaxTries].settingRestriction?.maxValue ?? 10
        })
      ),
    [SettingName.InvoiceReminderFreq]: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        settings[SettingName.InvoiceReminderFreq].settingRestriction?.minValue ?? 0,
        settings[SettingName.InvoiceReminderFreq].settingRestriction?.maxValue ?? 30,
        t('errorMessages.invalidRange', {
          min: settings[SettingName.InvoiceReminderFreq].settingRestriction?.minValue ?? 0,
          max: settings[SettingName.InvoiceReminderFreq].settingRestriction?.maxValue ?? 30
        })
      )
  })

  const formValue = Object.values(settings).reduce(
    (values, setting) => ({
      ...values,
      [setting.name]: setting.value
    }),
    {} as Record<SettingName, unknown>
  )

  return (
    <>
      <Form
        disabled={isDisabled}
        model={validationModel}
        formValue={formValue}
        onSubmit={validationPassed => validationPassed && setShowWarning(true)}>
        <Form.Group>
          <h2>{t('settingList.settings')}</h2>
        </Form.Group>

        <Grid fluid>
          <Row>
            {/* first column */}
            <Col xs={12}>
              <Row>
                {/* comments */}
                <Col xs={24}>
                  <Panel bordered header={t('settingList.comments')}>
                    <Form.Group controlId={SettingName.AllowGuestCommenting}>
                      <Form.ControlLabel>
                        {t('settingList.guestCommenting')}
                        <SettingInfo text={t('settingList.warnings.guestCommenting')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.AllowGuestCommenting].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.AllowGuestCommenting],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    {/* Allow guest rating of a comment */}
                    <Form.Group controlId={SettingName.AllowGuestCommentRating}>
                      <Form.ControlLabel>
                        {t('settingList.allowGuestCommentRating')}
                        <SettingInfo text={t('settingList.warnings.guestCommentRating')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.AllowGuestCommentRating].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.AllowGuestCommentRating],
                            value: checked
                          })
                        }
                      />
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
                        <SettingInfo text={t('settingList.warnings.guestPollVote')} />
                      </>
                    }>
                    <Form.Group controlId="guestPollVote">
                      <Form.ControlLabel>{t('settingList.guestPollVote')}</Form.ControlLabel>
                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.AllowGuestPollVoting].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.AllowGuestPollVoting],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>
                  </Panel>
                </Col>

                {/* Memberships */}
                <Col xs={24}>
                  <Panel bordered header={t('settingList.memberships')}>
                    <Form.Group controlId={SettingName.MakeNewSubscribersApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.newSubscriptionsApiPublic')}
                        <SettingInfo text={t('settingList.warnings.newSubscriptionsApiPublic')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeNewSubscribersApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeNewSubscribersApiPublic],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.MakeActiveSubscribersApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.activeSubscriptionsApiPublic')}
                        <SettingInfo
                          text={t('settingList.warnings.activeSubscriptionsApiPublic')}
                        />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeActiveSubscribersApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeActiveSubscribersApiPublic],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.MakeRenewingSubscribersApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.renewingSubscriptionsApiPublic')}
                        <SettingInfo
                          text={t('settingList.warnings.renewingSubscriptionsApiPublic')}
                        />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeRenewingSubscribersApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeRenewingSubscribersApiPublic],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.MakeNewDeactivationsApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.newDeactivationsApiPublic')}
                        <SettingInfo text={t('settingList.warnings.newDeactivationsApiPublic')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeNewDeactivationsApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeNewDeactivationsApiPublic],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.MakeExpectedRevenueApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.expectedRevenueApiPublic')}
                        <SettingInfo text={t('settingList.warnings.expectedRevenueApiPublic')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeExpectedRevenueApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeExpectedRevenueApiPublic],
                            value: checked
                          })
                        }
                      />
                    </Form.Group>

                    <Form.Group controlId={SettingName.MakeRevenueApiPublic}>
                      <Form.ControlLabel>
                        {t('settingList.revenueApiPublic')}
                        <SettingInfo text={t('settingList.warnings.revenueApiPublic')} />
                      </Form.ControlLabel>

                      <Toggle
                        disabled={isDisabled}
                        checked={settings[SettingName.MakeRevenueApiPublic].value}
                        onChange={checked =>
                          setSetting({
                            ...settings[SettingName.MakeRevenueApiPublic],
                            value: checked
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
                  <Panel bordered header={t('settingList.login')}>
                    <Form.Group controlId={SettingName.SendLoginJwtExpiresMin}>
                      <Form.ControlLabel>
                        {t('settingList.loginMinutes')}
                        <SettingInfo text={t('settingList.warnings.loginMinutes')} />
                      </Form.ControlLabel>

                      <InputGroup>
                        <FormControl
                          name={SettingName.SendLoginJwtExpiresMin}
                          accepter={InputNumber}
                          value={settings[SettingName.SendLoginJwtExpiresMin].value}
                          onChange={(value: string) =>
                            setSetting({
                              ...settings[SettingName.SendLoginJwtExpiresMin],
                              value: +value
                            })
                          }
                        />

                        <InputGroupAddon>{t('settingList.minutes')}</InputGroupAddon>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group controlId={SettingName.ResetPasswordJwtExpiresMin}>
                      <Form.ControlLabel>
                        {t('settingList.passwordToken')}
                        <SettingInfo text={t('settingList.warnings.passwordToken')} />
                      </Form.ControlLabel>

                      <InputGroup>
                        <Form.Control
                          name={SettingName.ResetPasswordJwtExpiresMin}
                          accepter={InputNumber}
                          value={settings[SettingName.ResetPasswordJwtExpiresMin].value}
                          onChange={(value: string) => {
                            setSetting({
                              ...settings[SettingName.ResetPasswordJwtExpiresMin],
                              value: +value
                            })
                          }}
                        />

                        <InputGroupAddon>{t('settingList.minutes')}</InputGroupAddon>
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
                        <SettingInfo text={t('settingList.warnings.peerToken')} />
                      </>
                    }>
                    <Form.Group controlId={SettingName.PeeringTimeoutMs}>
                      <Form.ControlLabel>{t('settingList.peerToken')}</Form.ControlLabel>
                      <InputGroup>
                        <Form.Control
                          name={SettingName.PeeringTimeoutMs}
                          accepter={InputNumber}
                          value={settings[SettingName.PeeringTimeoutMs].value}
                          onChange={(value: string) => {
                            setSetting({
                              ...settings[SettingName.PeeringTimeoutMs],
                              value: +value
                            })
                          }}
                        />
                        <InputGroupAddon>{t('settingList.ms')}</InputGroupAddon>
                      </InputGroup>
                    </Form.Group>
                  </Panel>
                </Col>

                {/* payment */}
                <Col xs={24}>
                  <Panel
                    bordered
                    header={
                      <>
                        {t('settingList.payment')}
                        <SettingInfo text={t('settingList.warnings.invoiceReminders')} />
                      </>
                    }>
                    <Form.Group controlId={SettingName.InvoiceReminderFreq}>
                      <Form.ControlLabel>{t('settingList.invoiceReminders')}</Form.ControlLabel>
                      <InputGroup>
                        <Form.Control
                          name={SettingName.InvoiceReminderFreq}
                          accepter={InputNumber}
                          value={settings[SettingName.InvoiceReminderFreq].value}
                          onChange={(value: string) =>
                            setSetting({
                              ...settings[SettingName.InvoiceReminderFreq],
                              value: +value
                            })
                          }
                        />
                        <InputGroupAddon>{t('settingList.days')}</InputGroupAddon>
                      </InputGroup>
                    </Form.Group>
                  </Panel>
                </Col>
              </Row>
            </Col>
          </Row>
        </Grid>

        {/* save btn */}
        <PermissionControl qualifyingPermissions={['CAN_UPDATE_SETTINGS']}>
          <Button type="submit" appearance="primary" disabled={isDisabled}>
            {t('save')}
          </Button>
        </PermissionControl>
      </Form>

      <Modal open={showWarning} backdrop="static" size="xs" onClose={() => setShowWarning(false)}>
        <Modal.Title>
          {t('invoice.areYouSure')}
          <WarningIcon />
        </Modal.Title>

        <Modal.Body>{t('settingList.warnings.askOperators')}</Modal.Body>

        <Modal.Footer>
          <Button appearance="primary" onClick={handleSettingListUpdate}>
            {t('confirm')}
          </Button>

          <Button appearance="subtle" onClick={() => setShowWarning(false)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
  'CAN_UPDATE_SETTINGS'
])(SettingList)
export {CheckedPermissionComponent as SettingList}
