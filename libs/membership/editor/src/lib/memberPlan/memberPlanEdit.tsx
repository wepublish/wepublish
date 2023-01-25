import React, {useEffect, useMemo, useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {createCheckedPermissionComponent} from '../../../../../../apps/editor/src/app/atoms/permissionControl'
import {
  FullMemberPlanFragment,
  PaymentMethod,
  useMemberPlanQuery,
  useUpdateMemberPlanMutation
} from '@wepublish/editor/api'
import {FlexboxGrid, Form, Panel, Schema, TagPicker} from 'rsuite'

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
            <FlexboxGrid.Item colspan={8}>
              <Panel bordered>
                <FlexboxGrid>
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
