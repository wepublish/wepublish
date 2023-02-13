import styled from '@emotion/styled'
import {
  Setting,
  SettingName,
  UpdateSettingArgs,
  useSettingListQuery,
  useUpdateSettingListMutation
} from '@wepublish/editor/api'
import {useEffect, useState} from 'react'
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
import {TypeAttributes} from 'rsuite/esm/@types/common'
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
  placement?: string
}

const SettingInfo = ({text, placement = 'right'}: SettingInfoProps) => (
  <Whisper
    trigger="hover"
    speaker={<Tooltip>{text}</Tooltip>}
    placement={placement as TypeAttributes.Placement}>
    <Info>
      <MdInfo />
    </Info>
  </Whisper>
)

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
  const [allowGuestComment, setAllowGuestComment] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.AllowGuestCommenting
  })
  const [allowGuestCommentRating, setAllowGuestCommentRating] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.AllowGuestCommentRating
  })
  const [allowGuestPollVoting, setAllowGuestPollVoting] = useState<Setting>({
    id: '',
    value: false,
    name: SettingName.AllowGuestPollVoting
  })
  const [sendLoginJwtExpiresMin, setSendLoginJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.SendLoginJwtExpiresMin
  })

  const [resetPwdJwtExpiresMin, setResetPwdJwtExpiresMin] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.ResetPasswordJwtExpiresMin
  })

  const [peeringTimeoutMs, setPeeringTimeoutMs] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.PeeringTimeoutMs
  })

  const [invoiceReminderTries, setInvoiceReminderTries] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.PeeringTimeoutMs
  })

  const [invoiceReminderFreq, setInvoiceReminderFreq] = useState<Setting>({
    id: '',
    value: 0,
    name: SettingName.InvoiceReminderFreq
  })

  useEffect(() => {
    if (settingListData?.settings) {
      const allowGuestCommentSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestCommenting
      )
      if (allowGuestCommentSetting) setAllowGuestComment(allowGuestCommentSetting)

      const allowGuestCommentRatingSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestCommentRating
      )
      if (allowGuestCommentRatingSetting) setAllowGuestCommentRating(allowGuestCommentRatingSetting)

      const allowGuestPollVotingSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.AllowGuestPollVoting
      )
      if (allowGuestPollVotingSetting) setAllowGuestPollVoting(allowGuestPollVotingSetting)

      const peeringTimeoutMsSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.PeeringTimeoutMs
      )
      if (peeringTimeoutMsSetting) setPeeringTimeoutMs(peeringTimeoutMsSetting)

      const sendLoginJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.SendLoginJwtExpiresMin
      )
      if (sendLoginJwtExpiresSetting) setSendLoginJwtExpiresMin(sendLoginJwtExpiresSetting)

      const resetPwdJwtExpiresSetting = settingListData?.settings?.find(
        setting => setting.name === SettingName.ResetPasswordJwtExpiresMin
      )
      if (resetPwdJwtExpiresSetting) setResetPwdJwtExpiresMin(resetPwdJwtExpiresSetting)

      const invoiceRetries = settingListData?.settings?.find(
        setting => setting.name === SettingName.InvoiceReminderMaxTries
      )
      if (invoiceRetries) setInvoiceReminderTries(invoiceRetries)

      const invoiceFreq = settingListData?.settings?.find(
        setting => setting.name === SettingName.InvoiceReminderFreq
      )
      if (invoiceFreq) setInvoiceReminderFreq(invoiceFreq)
    }
  }, [settingListData])

  const [updateSettings, {error: updateSettingError}] = useUpdateSettingListMutation({
    fetchPolicy: 'network-only'
  })

  async function handleSettingListUpdate() {
    setShowWarning(false)

    const allSettings: UpdateSettingArgs[] = [
      {name: SettingName.AllowGuestCommenting, value: allowGuestComment.value},
      {name: SettingName.AllowGuestCommentRating, value: allowGuestCommentRating.value},
      {name: SettingName.AllowGuestPollVoting, value: allowGuestPollVoting.value},
      {name: SettingName.SendLoginJwtExpiresMin, value: parseInt(sendLoginJwtExpiresMin?.value)},
      {name: SettingName.ResetPasswordJwtExpiresMin, value: parseInt(resetPwdJwtExpiresMin.value)},
      {name: SettingName.PeeringTimeoutMs, value: parseInt(peeringTimeoutMs.value)},
      {name: SettingName.InvoiceReminderMaxTries, value: parseInt(invoiceReminderTries.value)},
      {name: SettingName.InvoiceReminderFreq, value: parseInt(invoiceReminderFreq.value)}
    ]
    await updateSettings({variables: {input: allSettings}})

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
  }, [fetchError, updateSettingError])

  const {NumberType} = Schema.Types

  const validationModel = Schema.Model({
    loginToken: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        sendLoginJwtExpiresMin?.settingRestriction?.minValue ?? 1,
        sendLoginJwtExpiresMin?.settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: sendLoginJwtExpiresMin?.settingRestriction?.minValue ?? 1,
          max: sendLoginJwtExpiresMin?.settingRestriction?.maxValue ?? 10080
        })
      ),
    passwordExpire: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        resetPwdJwtExpiresMin.settingRestriction?.minValue ?? 10,
        resetPwdJwtExpiresMin.settingRestriction?.maxValue ?? 10080,
        t('errorMessages.invalidRange', {
          min: resetPwdJwtExpiresMin.settingRestriction?.minValue ?? 10,
          max: resetPwdJwtExpiresMin.settingRestriction?.maxValue ?? 10080
        })
      ),
    peeringTimeout: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        peeringTimeoutMs.settingRestriction?.minValue ?? 1000,
        peeringTimeoutMs.settingRestriction?.maxValue ?? 10000,
        t('errorMessages.invalidRange', {
          min: peeringTimeoutMs.settingRestriction?.minValue ?? 1000,
          max: peeringTimeoutMs.settingRestriction?.maxValue ?? 10000
        })
      ),
    invoiceTries: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        invoiceReminderTries.settingRestriction?.minValue ?? 0,
        invoiceReminderTries.settingRestriction?.maxValue ?? 10,
        t('errorMessages.invalidRange', {
          min: invoiceReminderTries.settingRestriction?.minValue ?? 0,
          max: invoiceReminderTries.settingRestriction?.maxValue ?? 10
        })
      ),
    invoiceFrequency: NumberType()
      .isRequired(t('errorMessages.required'))
      .range(
        invoiceReminderFreq.settingRestriction?.minValue ?? 0,
        invoiceReminderFreq.settingRestriction?.maxValue ?? 30,
        t('errorMessages.invalidRange', {
          min: invoiceReminderFreq.settingRestriction?.minValue ?? 0,
          max: invoiceReminderFreq.settingRestriction?.maxValue ?? 30
        })
      )
  })

  return (
    <>
      <Form
        disabled={isDisabled}
        model={validationModel}
        formValue={{
          loginToken: sendLoginJwtExpiresMin.value,
          passwordExpire: resetPwdJwtExpiresMin.value,
          peeringTimeout: peeringTimeoutMs.value,
          invoiceTries: invoiceReminderTries.value,
          invoiceFrequency: invoiceReminderFreq.value
        }}
        onSubmit={async validationPassed => {
          validationPassed && (await setShowWarning(true))
        }}>
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
                    <Form.Group controlId="guestCommenting">
                      <Form.ControlLabel>
                        {t('settingList.guestCommenting')}
                        <SettingInfo text={t('settingList.warnings.guestCommenting')} />
                      </Form.ControlLabel>
                      <Toggle
                        disabled={isDisabled}
                        checked={allowGuestComment?.value}
                        onChange={checked =>
                          setAllowGuestComment({
                            ...allowGuestComment,
                            value: checked
                          })
                        }
                      />
                    </Form.Group>
                    {/* Allow guest rating of a comment */}
                    <Form.Group controlId="guestCommentRating">
                      <Form.ControlLabel>
                        {t('settingList.allowGuestCommentRating')}
                        <SettingInfo text={t('settingList.warnings.guestCommentRating')} />
                      </Form.ControlLabel>
                      <Toggle
                        disabled={isDisabled}
                        checked={allowGuestCommentRating?.value}
                        onChange={checked =>
                          setAllowGuestCommentRating({
                            ...allowGuestCommentRating,
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
                        checked={allowGuestPollVoting?.value}
                        onChange={checked =>
                          setAllowGuestPollVoting({
                            ...allowGuestPollVoting,
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
                    <Form.Group controlId="loginMinutes">
                      <Form.ControlLabel>
                        {t('settingList.loginMinutes')}
                        <SettingInfo
                          placement="left"
                          text={t('settingList.warnings.loginMinutes')}
                        />
                      </Form.ControlLabel>
                      <InputGroup>
                        <FormControl
                          name="loginToken"
                          accepter={InputNumber}
                          value={sendLoginJwtExpiresMin.value}
                          onChange={(value: number) =>
                            setSendLoginJwtExpiresMin({
                              ...sendLoginJwtExpiresMin,
                              value
                            })
                          }
                        />
                        <InputGroupAddon>{t('settingList.minutes')}</InputGroupAddon>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group controlId="passwordToken">
                      <Form.ControlLabel>
                        {t('settingList.passwordToken')}
                        <SettingInfo
                          placement="left"
                          text={t('settingList.warnings.passwordToken')}
                        />
                      </Form.ControlLabel>
                      <InputGroup>
                        <Form.Control
                          name="passwordExpire"
                          accepter={InputNumber}
                          value={resetPwdJwtExpiresMin.value}
                          onChange={(value: number) => {
                            setResetPwdJwtExpiresMin({...resetPwdJwtExpiresMin, value})
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
                    <Form.Group controlId="peerToken">
                      <Form.ControlLabel>{t('settingList.peerToken')}</Form.ControlLabel>
                      <InputGroup>
                        <Form.Control
                          name="peeringTimeout"
                          accepter={InputNumber}
                          value={peeringTimeoutMs.value}
                          onChange={(value: number) => {
                            setPeeringTimeoutMs({
                              ...peeringTimeoutMs,
                              value
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
                    <Form.Group controlId="invoiceReminders">
                      <Form.ControlLabel>{t('settingList.invoiceReminders')}</Form.ControlLabel>
                      <InputGroup>
                        <Form.Control
                          name="invoiceFrequency"
                          accepter={InputNumber}
                          value={invoiceReminderFreq.value}
                          onChange={(value: number) =>
                            setInvoiceReminderFreq({
                              ...invoiceReminderFreq,
                              value
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
          <>
            {t('invoice.areYouSure')}
            <WarningIcon />
          </>
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
