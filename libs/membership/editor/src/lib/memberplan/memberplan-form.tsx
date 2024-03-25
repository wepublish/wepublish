import React, {Dispatch, SetStateAction, useMemo, useState} from 'react'
import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  ImageRefFragment,
  PaymentMethod
} from '@wepublish/editor/api'
import {
  Button,
  CheckPicker,
  Col,
  Divider,
  Drawer,
  Form as RForm,
  Form,
  Input,
  Message,
  Panel,
  Row,
  TagPicker,
  toaster,
  Toggle
} from 'rsuite'
import {useTranslation} from 'react-i18next'
import styled from '@emotion/styled'
import {slugify} from '@wepublish/utils'
import {
  ALL_PAYMENT_PERIODICITIES,
  ChooseEditImage,
  CurrencyInput,
  ImageEditPanel,
  ImageSelectPanel,
  ListInput,
  ListValue,
  RichTextBlock,
  RichTextBlockValue
} from '@wepublish/ui/editor'
import {MdAutoFixHigh, MdCheck} from 'react-icons/md'
import {Alert} from '@mui/material'
import {T} from 'ramda'

const {ControlLabel, HelpText} = RForm

const ColTextAlignEnd = styled(Col)`
  text-align: end;
`

const FormControlLabelMarginRight = styled(Form.ControlLabel)`
  margin-right: 10px;
`

const PanelWidth100 = styled(Panel)`
  width: 100%;
`

const RowPaddingTop = styled(Row)`
  padding-top: 12px;
`

interface MemberPlanFormProps {
  memberPlanId?: string
  memberPlan?: FullMemberPlanFragment | null
  availablePaymentMethods: ListValue<AvailablePaymentMethod>[]
  paymentMethods: FullPaymentMethodFragment[]
  loading: boolean
  setMemberPlan: Dispatch<SetStateAction<FullMemberPlanFragment | null | undefined>>
  setAvailablePaymentMethods: Dispatch<SetStateAction<ListValue<AvailablePaymentMethod>[]>>
}

export function MemberPlanForm({
  memberPlanId,
  memberPlan,
  availablePaymentMethods,
  paymentMethods,
  loading,
  setMemberPlan,
  setAvailablePaymentMethods
}: MemberPlanFormProps) {
  const {t} = useTranslation()
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const isTrialSubscription = useMemo(
    () => !memberPlan?.extendable && !!memberPlan?.maxCount,
    [memberPlan]
  )

  /**
   * Method to set default member plan settings for regular trial subscription.
   * This is a function for user convenience.
   */
  function preDefineTrialSubscription(): void {
    const success = setExtendable(true)
    if (!success) {
      return
    }
    setMaxCount(1)
  }

  function setExtendable(extendable: boolean): boolean {
    // a subscription plan must be extendable if at least one payment methods requires auto renew
    const forcedAutoRenewPaymentMethods = !!availablePaymentMethods.find(
      apm => apm.value.forceAutoRenewal
    )
    if (forcedAutoRenewPaymentMethods) {
      toaster.push(
        <Message type="error" showIcon closable>
          {t('memberplanForm.trialSubscriptionNotPossible')}
        </Message>,
        {duration: 6000}
      )
      return false
    }
    if (!memberPlan) {
      return false
    }
    // update extendable prop of the member plan
    setMemberPlan({
      ...memberPlan,
      extendable
    })
    return true
  }

  function setMaxCount(maxCount: number): boolean {
    if (!memberPlan) {
      return false
    }
    setMemberPlan({
      ...memberPlan,
      maxCount
    })
    return true
  }

  function changeForeAutoRenewal(
    forceAutoRenewal: boolean,
    onChange: React.Dispatch<React.SetStateAction<AvailablePaymentMethod>>,
    availablePaymentMethod: AvailablePaymentMethod
  ): void {
    // if subscription plan ist not extendable, a subscription can not be forced to be auto-renew.
    if (!memberPlan?.extendable && forceAutoRenewal) {
      // inform user
      toaster.push(
        <Message type="error" showIcon closable>
          {t('memberplanForm.forceAutoRenewNotPossible')}
        </Message>
      )
      // cancel action
      return
    }
    onChange({...availablePaymentMethod, forceAutoRenewal})
  }

  function updateName(name: string | undefined) {
    setMemberPlan(memberPlan => {
      if (!memberPlan) {
        return
      }

      name = name || ''
      let slug = memberPlan.slug

      // only update slug, if we create a new member plan
      if (!memberPlanId) {
        slug = slugify(name)
      }

      return {...memberPlan, name, slug}
    })
  }

  return (
    <Row>
      <Col xs={12}>
        <PanelWidth100 bordered>
          <Row>
            {/* image */}
            <Col xs={12}>
              <ChooseEditImage
                image={memberPlan?.image}
                disabled={loading}
                openChooseModalOpen={() => setChooseModalOpen(true)}
                openEditModalOpen={() => setEditModalOpen(true)}
                removeImage={() => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, image: undefined})
                }}
              />
            </Col>

            {/* active / inactive */}
            <ColTextAlignEnd xs={12}>
              <FormControlLabelMarginRight>
                {t('memberPlanEdit.active')}
              </FormControlLabelMarginRight>
              <Toggle
                checked={!!memberPlan?.active}
                disabled={loading}
                onChange={active => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, active})
                }}
              />
              <Form.HelpText>{t('memberPlanEdit.activeDescription')}</Form.HelpText>
            </ColTextAlignEnd>

            <Col xs={24}>
              <Row>
                {/* name */}
                <Col xs={12}>
                  <Form.ControlLabel>{t('memberPlanEdit.name')}</Form.ControlLabel>
                  <Form.Control
                    name="name"
                    value={memberPlan?.name || ''}
                    onChange={(newName: string | undefined) => updateName(newName)}
                  />
                </Col>

                {/* slug */}
                <Col xs={12}>
                  <Form.ControlLabel>{t('memberPlanEdit.slug')}</Form.ControlLabel>
                  <Form.Control
                    name="slug"
                    value={memberPlan?.slug || ''}
                    onChange={(newSlug: string | undefined) => {
                      if (!memberPlan) {
                        return
                      }
                      setMemberPlan({...memberPlan, slug: slugify(newSlug || '')})
                    }}
                  />
                </Col>
              </Row>
            </Col>

            {/* description */}
            <Col xs={24}>
              <Form.ControlLabel>{t('memberPlanEdit.description')}</Form.ControlLabel>
              <div className="richTextFrame">
                <RichTextBlock
                  value={memberPlan?.description || []}
                  disabled={loading}
                  onChange={newDescription => {
                    if (!memberPlan) {
                      return
                    }
                    setMemberPlan({
                      ...memberPlan,
                      description: (newDescription as RichTextBlockValue['richText']) || []
                    })
                  }}
                />
              </div>
            </Col>
          </Row>
        </PanelWidth100>
      </Col>
      <Col xs={12}>
        <Panel bordered>
          <Row>
            {/* tags */}
            <Col xs={12}>
              <Form.ControlLabel>{t('memberPlanEdit.tags')}</Form.ControlLabel>
              <TagPicker
                disabled={loading}
                block
                virtualized
                value={memberPlan?.tags ?? []}
                creatable
                data={
                  memberPlan?.tags ? memberPlan.tags.map(tag => ({label: tag, value: tag})) : []
                }
                onChange={tagsValue => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, tags: tagsValue})
                }}
              />
            </Col>

            {/* minimal monthly amount */}
            <Col xs={12}>
              <Form.ControlLabel>{t('memberPlanEdit.amountPerMonthMin')}</Form.ControlLabel>
              <CurrencyInput
                name="currency"
                currency="CHF"
                centAmount={memberPlan?.amountPerMonthMin || 0}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, amountPerMonthMin: centAmount})
                }}
              />
            </Col>
          </Row>
        </Panel>
      </Col>

      {/* payment method settings */}
      <Col xs={12}>
        <Panel header={t('memberPlanEdit.paymentConfigs')} bordered>
          <Row>
            <Col xs={24}>
              <ListInput
                value={availablePaymentMethods}
                disabled={loading}
                onChange={app => setAvailablePaymentMethods(app)}
                defaultValue={{
                  forceAutoRenewal: false,
                  paymentPeriodicities: [],
                  paymentMethods: []
                }}>
                {({value, onChange}) => (
                  <Panel
                    collapsible
                    bordered
                    header={t('memberPlanEdit.editPaymentSetting')}
                    style={{width: '100%'}}>
                    <Row>
                      {/* force auto-renew */}
                      <Col xs={24}>
                        <FormControlLabelMarginRight>
                          {t('memberPlanEdit.forceAutoRenewal')}
                        </FormControlLabelMarginRight>
                        <Toggle
                          checked={value.forceAutoRenewal}
                          disabled={loading}
                          onChange={forceAutoRenewal =>
                            changeForeAutoRenewal(forceAutoRenewal, onChange, value)
                          }
                        />
                        <Form.HelpText>{t('memberPlanEdit.autoRenewalDescription')}</Form.HelpText>
                      </Col>

                      {/* payment periodicity */}
                      <Col xs={24}>
                        <Form.ControlLabel>
                          {t('memberPlanList.paymentPeriodicities')}
                        </Form.ControlLabel>
                        <CheckPicker
                          virtualized
                          value={value.paymentPeriodicities}
                          data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                            value: pp,
                            label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                          }))}
                          onChange={paymentPeriodicities =>
                            onChange({...value, paymentPeriodicities})
                          }
                          block
                          placement="auto"
                        />
                      </Col>

                      {/* payment method selection */}
                      <Col xs={24}>
                        <Form.ControlLabel>{t('memberPlanList.paymentMethods')}</Form.ControlLabel>
                        <CheckPicker
                          virtualized
                          value={value.paymentMethods.map(pm => pm.id)}
                          data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                          onChange={paymentMethodIDs => {
                            onChange({
                              ...value,
                              paymentMethods: paymentMethodIDs
                                .map(pmID => paymentMethods.find(pm => pm.id === pmID))
                                .filter(pm => pm !== undefined)
                                .map(pm => pm as PaymentMethod)
                            })
                          }}
                          block
                          placement="auto"
                        />
                      </Col>

                      {availablePaymentMethods.length > 1 && (
                        <Col xs={24}>
                          <Divider />
                        </Col>
                      )}
                    </Row>
                  </Panel>
                )}
              </ListInput>
            </Col>
          </Row>
        </Panel>
      </Col>

      <Col xs={12}>
        <Panel header={t('memberplanForm.trialSubscription')} bordered>
          {/* automatically configure trial subscription */}
          <Row>
            <Col xs={24}>
              {isTrialSubscription ? (
                <Alert icon={<MdCheck />} severity="success">
                  {t('memberplanForm.trialMemberplanAlert')}
                </Alert>
              ) : (
                <Button
                  startIcon={<MdAutoFixHigh />}
                  onClick={preDefineTrialSubscription}
                  disabled={isTrialSubscription}
                  color={'green'}>
                  {t('memberplanForm.configureTrialBtn')}
                </Button>
              )}
            </Col>
          </Row>
          <RowPaddingTop>
            {/* extendable */}
            <Col xs={12}>
              <FormControlLabelMarginRight>
                {t('memberplanForm.extendableToggle')}
              </FormControlLabelMarginRight>
              <Toggle
                checked={memberPlan?.extendable}
                onChange={extendable => setExtendable(extendable)}
              />
              <HelpText>{t('memberplanForm.extendableHelpText')}</HelpText>
            </Col>
            {/* max count */}
            <Col xs={12}>
              <ControlLabel>{t('memberplanForm.maxCount')}</ControlLabel>
              <Input
                placeholder={t('memberplanForm.maxCount')}
                type={'number'}
                min={0}
                value={memberPlan?.maxCount || undefined}
                onChange={maxCount => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, maxCount: Number(maxCount) || null})
                }}
              />
              <HelpText>{t('memberplanForm.maxCountHelpText')}</HelpText>
            </Col>
          </RowPaddingTop>
        </Panel>
      </Col>

      {/* image upload and selection */}
      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(image: ImageRefFragment) => {
            setChooseModalOpen(false)
            if (!memberPlan) {
              return
            }
            setMemberPlan({...memberPlan, image})
          }}
        />
      </Drawer>

      {memberPlan?.image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel
            id={memberPlan.image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </Row>
  )
}
