import React, {useState} from 'react'
import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  ImageRefFragment,
  PaymentMethod
} from '@wepublish/editor/api'
import {ListInput, ListValue} from '../../../../../../apps/editor/src/app/atoms/listInput'
import {CheckPicker, Drawer, FlexboxGrid, Form, Panel, TagPicker, Toggle} from 'rsuite'
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
    <FlexboxGrid>
      <FlexboxGrid.Item colspan={12}>
        <Panel bordered>
          <FlexboxGrid>
            {/* image */}
            <FlexboxGrid.Item colspan={12}>
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
            </FlexboxGrid.Item>

            {/* active / inactive */}
            <FlexboxGrid.Item colspan={12}>
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
            </FlexboxGrid.Item>

            {/* name */}
            <FlexboxGrid.Item colspan={12}>
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
            </FlexboxGrid.Item>

            {/* slug */}
            <FlexboxGrid.Item colspan={12}>
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
            </FlexboxGrid.Item>

            {/* description */}
            <FlexboxGrid.Item colspan={24}>
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
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Panel>
      </FlexboxGrid.Item>
      <FlexboxGrid.Item colspan={12}>
        <Panel bordered>
          <FlexboxGrid>
            {/* tags */}
            <FlexboxGrid.Item colspan={24}>
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
            </FlexboxGrid.Item>

            {/* minimal monthly amount */}
            <FlexboxGrid.Item colspan={24}>
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
            </FlexboxGrid.Item>

            <FlexboxGrid.Item colspan={24}>
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
                  <FlexboxGrid>
                    {/* force auto-renew */}
                    <FlexboxGrid.Item colspan={24}>
                      <Form.ControlLabel>{t('memberPlanList.autoRenewal')}</Form.ControlLabel>
                      <Toggle
                        checked={value.forceAutoRenewal}
                        disabled={loading}
                        onChange={forceAutoRenewal => onChange({...value, forceAutoRenewal})}
                      />
                      <Form.HelpText>{t('memberPlanList.autoRenewalDescription')}</Form.HelpText>
                    </FlexboxGrid.Item>

                    {/* payment periodicity */}
                    <FlexboxGrid.Item colspan={24}>
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
                    </FlexboxGrid.Item>

                    {/* payment method selection */}
                    <FlexboxGrid.Item colspan={24}>
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
                    </FlexboxGrid.Item>
                  </FlexboxGrid>
                )}
              </ListInput>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Panel>
      </FlexboxGrid.Item>

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
    </FlexboxGrid>
  )
}
