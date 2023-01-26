import React, {useState} from 'react'
import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  ImageRefFragment,
  PaymentMethod
} from '@wepublish/editor/api'
import {ListInput, ListValue} from '../../../../../../apps/editor/src/app/atoms/listInput'
import {CheckPicker, Col, Drawer, FlexboxGrid, Form, Panel, Row, TagPicker, Toggle} from 'rsuite'
import {ChooseEditImage} from '../../../../../../apps/editor/src/app/atoms/chooseEditImage'
import {RichTextBlock} from '../../../../../../apps/editor/src/app/blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../../../../../../apps/editor/src/app/blocks/types'
import {CurrencyInput} from '../../../../../../apps/editor/src/app/atoms/currencyInput'
import {ALL_PAYMENT_PERIODICITIES} from '../../../../../../apps/editor/src/app/utility'
import {useTranslation} from 'react-i18next'
import {ImageSelectPanel} from '../../../../../../apps/editor/src/app/panel/imageSelectPanel'
import {ImageEditPanel} from '../../../../../../apps/editor/src/app/panel/imageEditPanel'

interface MemberPlanFormProps {
  memberPlan?: FullMemberPlanFragment | null
  availablePaymentMethods: ListValue<AvailablePaymentMethod>[]
  paymentMethods: FullPaymentMethodFragment[]
  loading: boolean
  setMemberPlan: React.Dispatch<React.SetStateAction<FullMemberPlanFragment | null | undefined>>
  setAvailablePaymentMethods: React.Dispatch<
    React.SetStateAction<ListValue<AvailablePaymentMethod>[]>
  >
}
export default function MemberPlanForm({
  memberPlan,
  availablePaymentMethods,
  paymentMethods,
  loading,
  setMemberPlan,
  setAvailablePaymentMethods
}: MemberPlanFormProps) {
  /**
   * Simple const
   */
  const {t} = useTranslation()

  /**
   * States
   */
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  return (
    <Row>
      <Col xs={12}>
        <Panel bordered>
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
            <Col xs={12}>
              <Form.ControlLabel>{t('memberPlanEdit.active')}</Form.ControlLabel>
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
              <Form.HelpText>{t('memberPlanList.activeDescription')}</Form.HelpText>
            </Col>

            {/* name */}
            <Col xs={12}>
              <Form.ControlLabel>{t('memberPlanEdit.name')}</Form.ControlLabel>
              <Form.Control
                name="name"
                value={memberPlan?.name || ''}
                onChange={(newName: string | undefined) => {
                  if (!memberPlan) {
                    return
                  }
                  setMemberPlan({...memberPlan, name: newName || ''})
                }}
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
                  setMemberPlan({...memberPlan, slug: newSlug || ''})
                }}
              />
            </Col>

            {/* description */}
            <Col xs={24}>
              <Form.ControlLabel>{t('memberPlanList.description')}</Form.ControlLabel>
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
                      description: (newDescription as RichTextBlockValue) || []
                    })
                  }}
                />
              </div>
            </Col>
          </Row>
        </Panel>
      </Col>
      <Col xs={12}>
        <Panel bordered>
          <Row>
            {/* tags */}
            <Col xs={24}>
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
            <Col xs={24}>
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

            <Col xs={24}>
              {/* payment method settings */}
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
                  <Row>
                    {/* force auto-renew */}
                    <Col xs={24}>
                      <Form.ControlLabel>{t('memberPlanList.autoRenewal')}</Form.ControlLabel>
                      <Toggle
                        checked={value.forceAutoRenewal}
                        disabled={loading}
                        onChange={forceAutoRenewal => onChange({...value, forceAutoRenewal})}
                      />
                      <Form.HelpText>{t('memberPlanList.autoRenewalDescription')}</Form.HelpText>
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
                  </Row>
                )}
              </ListInput>
            </Col>
          </Row>
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
