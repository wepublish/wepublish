import React, {useEffect, useMemo, useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {createCheckedPermissionComponent} from '../../../../../../apps/editor/src/app/atoms/permissionControl'
import {
  FullMemberPlanFragment,
  ImageRefFragment,
  PaymentMethod,
  useMemberPlanQuery,
  useUpdateMemberPlanMutation
} from '@wepublish/editor/api'
import {Drawer, FlexboxGrid, Form, Panel, Schema, TagPicker, Toggle} from 'rsuite'
import {ChooseEditImage} from '../../../../../../apps/editor/src/app/atoms/chooseEditImage'
import {ImageSelectPanel} from '../../../../../../apps/editor/src/app/panel/imageSelectPanel'
import {ImageEditPanel} from '../../../../../../apps/editor/src/app/panel/imageEditPanel'
import {toggleRequiredLabel} from '../../../../../../apps/editor/src/app/toggleRequiredLabel'
import {CurrencyInput} from '../../../../../../apps/editor/src/app/atoms/currencyInput'
import {RichTextBlock} from '../../../../../../apps/editor/src/app/blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../../../../../../apps/editor/src/app/blocks/types'

function MemberPlanEdit() {
  /**
   * Simple const
   */
  const navigate = useNavigate()
  const {t} = useTranslation()
  const closePath = '/memberplans'
  const {id: memberPlanId} = useParams()

  /**
   * States
   */
  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment | null | undefined>(undefined)
  const [close, setClose] = useState<boolean>(false)
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  /**
   * Services
   */
  const {data: memberPlanData, loading: memberPlanLoading} = useMemberPlanQuery({
    variables: {id: memberPlanId!},
    fetchPolicy: 'network-only'
  })

  const [updateMemberPlanMutation, {loading: memberPlanUpdating}] = useUpdateMemberPlanMutation()

  useEffect(() => {
    setMemberPlan(memberPlanData?.memberPlan)
  }, [memberPlanData])

  /**
   * Loading indicator
   */
  const loading: boolean = useMemo(() => {
    return !!memberPlanLoading || !!memberPlanUpdating
  }, [memberPlanLoading, memberPlanUpdating])

  /**
   * Schema validation
   */
  const validationModel = Schema.Model({
    name: Schema.Types.StringType().isRequired(t('memberPlanEdit.nameRequired'))
  })

  /**
   * Functions
   */
  async function updateMemberPlan() {
    if (!memberPlan || !memberPlanId) {
      return
    }
    await updateMemberPlanMutation({
      variables: {
        id: memberPlanId,
        input: {
          name: memberPlan.name,
          slug: memberPlan.slug,
          tags: memberPlan.tags,
          imageID: memberPlan.image?.id,
          description: memberPlan.description,
          active: memberPlan.active,
          availablePaymentMethods: memberPlan.availablePaymentMethods.map(value => ({
            paymentPeriodicities: value.paymentPeriodicities,
            forceAutoRenewal: value.forceAutoRenewal,
            paymentMethodIDs: value.paymentMethods.map((pm: PaymentMethod) => pm.id)
          })),
          amountPerMonthMin: memberPlan.amountPerMonthMin
        }
      }
    })

    if (close) {
      navigate(closePath)
    }
  }

  return (
    <SingleView>
      <Form
        onSubmit={validationPassed => validationPassed && updateMemberPlan()}
        model={validationModel}
        fluid
        disabled={loading}
        formValue={{name: memberPlan?.name}}>
        <SingleViewTitle
          loading={loading}
          loadingTitle={t('memberPlanEdit.loadingTitle')}
          title={t('memberPlanEdit.title')}
          saveBtnTitle={t('memberPlanEdit.saveBtnTitle')}
          saveAndCloseBtnTitle={t('memberPlanEdit.saveAndCloseBtnTitle')}
          closePath={closePath}
          setCloseFn={value => setClose(value)}
        />
        <SingleViewContent>
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
                  <FlexboxGrid.Item colspan={24}>
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
                  <FlexboxGrid.Item colspan={24}>
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
                        memberPlan?.tags
                          ? memberPlan.tags.map(tag => ({label: tag, value: tag}))
                          : []
                      }
                      onChange={tagsValue => {
                        if (!memberPlan) {
                          return
                        }
                        setMemberPlan({...memberPlan, tags: tagsValue})
                      }}
                    />
                  </FlexboxGrid.Item>
                </FlexboxGrid>
              </Panel>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </SingleViewContent>

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
      </Form>
    </SingleView>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN'
])(MemberPlanEdit)
export {CheckedPermissionComponent as MemberPlanEdit}
