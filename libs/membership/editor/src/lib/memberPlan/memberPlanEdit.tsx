import React, {useEffect, useMemo, useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {createCheckedPermissionComponent} from '../../../../../../apps/editor/src/app/atoms/permissionControl'
import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  PaymentMethod,
  useMemberPlanQuery,
  usePaymentMethodListQuery,
  useUpdateMemberPlanMutation
} from '@wepublish/editor/api'
import {Form, Schema} from 'rsuite'
import {generateID} from '../../../../../../apps/editor/src/app/utility'
import {ListValue} from '../../../../../../apps/editor/src/app/atoms/listInput'
import MemberPlanForm from './memberPlanForm'

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
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    ListValue<AvailablePaymentMethod>[]
  >([])

  /**
   * Services
   */
  const {data: memberPlanData, loading: memberPlanLoading} = useMemberPlanQuery({
    variables: {id: memberPlanId!},
    fetchPolicy: 'network-only'
  })
  const {data: paymentMethodData, loading: paymentMethodLoading} = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [updateMemberPlanMutation, {loading: memberPlanUpdating}] = useUpdateMemberPlanMutation()

  useEffect(() => {
    const memberPlan = memberPlanData?.memberPlan
    setMemberPlan(memberPlan)
    setAvailablePaymentMethods(
      (memberPlan?.availablePaymentMethods || []).map(availablePaymentMethod => ({
        id: generateID(),
        value: availablePaymentMethod
      }))
    )
  }, [memberPlanData])

  /**
   * Memos
   */
  const loading: boolean = useMemo(() => {
    return !!memberPlanLoading || !!memberPlanUpdating || !!paymentMethodLoading
  }, [memberPlanLoading, memberPlanUpdating, paymentMethodLoading])

  const paymentMethods: FullPaymentMethodFragment[] = useMemo(() => {
    return paymentMethodData?.paymentMethods || []
  }, [paymentMethodData])

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
          availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
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
          <MemberPlanForm
            memberPlan={memberPlan}
            availablePaymentMethods={availablePaymentMethods}
            paymentMethods={paymentMethods}
            loading={loading}
            setMemberPlan={setMemberPlan}
            setAvailablePaymentMethods={setAvailablePaymentMethods}
          />
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
