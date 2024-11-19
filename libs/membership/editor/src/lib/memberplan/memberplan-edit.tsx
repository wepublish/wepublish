import {ApolloError} from '@apollo/client'
import {
  AvailablePaymentMethod,
  Currency,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  MemberPlanInput,
  PaymentMethod,
  useCreateMemberPlanMutation,
  useMemberPlanLazyQuery,
  usePaymentMethodListQuery,
  useUpdateMemberPlanMutation
} from '@wepublish/editor/api'
import {
  ListValue,
  SingleView,
  SingleViewContent,
  SingleViewTitle,
  createCheckedPermissionComponent,
  generateID
} from '@wepublish/ui/editor'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Form, Message, Schema, toaster} from 'rsuite'
import {MemberPlanForm} from './memberplan-form'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

const closePath = '/memberplans'

function MemberPlanEdit() {
  const navigate = useNavigate()
  const {t} = useTranslation()
  const {id: memberPlanId} = useParams()

  const [memberPlan, setMemberPlan] = useState<FullMemberPlanFragment | null>()
  const [close, setClose] = useState<boolean>(false)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    ListValue<AvailablePaymentMethod>[]
  >([])

  const [fetchMemberPlan, {loading: memberPlanLoading, data: memberPlanData}] =
    useMemberPlanLazyQuery({
      fetchPolicy: 'network-only',
      onError: showErrors
    })

  const {data: paymentMethodData, loading: paymentMethodLoading} = usePaymentMethodListQuery({
    fetchPolicy: 'network-only',
    onError: showErrors
  })

  const [updateMemberPlanMutation, {loading: memberPlanUpdating}] = useUpdateMemberPlanMutation({
    fetchPolicy: 'network-only',
    onError: showErrors
  })

  const [createMemberPlanMutation, {loading: memberPlanCreating}] = useCreateMemberPlanMutation({
    fetchPolicy: 'network-only',
    onError: showErrors
  })

  useEffect(() => {
    if (!memberPlanId) {
      return
    }

    fetchMemberPlan({
      variables: {
        id: memberPlanId
      }
    })
  }, [fetchMemberPlan, memberPlanId])

  // initially set member plan and available payment methods
  useEffect(() => {
    const initMemberPlan = memberPlanData?.memberPlan || {
      id: 'dummy-id',
      availablePaymentMethods: [],
      description: [],
      currency: Currency.Chf,
      amountPerMonthMin: 0,
      image: undefined,
      active: true,
      tags: [],
      slug: '',
      name: '',
      extendable: true,
      maxCount: undefined
    }

    setMemberPlan(initMemberPlan)
    setAvailablePaymentMethods(
      (initMemberPlan?.availablePaymentMethods || []).map(availablePaymentMethod => ({
        id: generateID(),
        value: {
          ...availablePaymentMethod,
          paymentMethods: availablePaymentMethod.paymentMethods as PaymentMethod[]
        }
      }))
    )
  }, [memberPlanData])

  const loading: boolean = useMemo(
    () => memberPlanLoading || memberPlanUpdating || paymentMethodLoading || memberPlanCreating,
    [memberPlanLoading, memberPlanUpdating, paymentMethodLoading, memberPlanCreating]
  )

  const paymentMethods: FullPaymentMethodFragment[] = useMemo(
    () => paymentMethodData?.paymentMethods || [],
    [paymentMethodData]
  )

  const header: string = useMemo(() => {
    if (!memberPlanId) {
      return memberPlan?.name || t('memberPlanEdit.createMemberPlanHeader')
    }

    return memberPlan?.name || t('memberPlanEdit.noMemberPlanName')
  }, [t, memberPlanId, memberPlan?.name])

  const validationModel = Schema.Model({
    name: Schema.Types.StringType().isRequired(t('memberPlanEdit.nameRequired')),
    slug: Schema.Types.StringType().isRequired(t('memberPlanEdit.slugRequired')),
    amountPerMonthMin: Schema.Types.NumberType()
      .isRequired(t('memberPlanEdit.amountPerMonthMinRequired'))
      .min(0, t('memberPlanEdit.amountPerMonthMinZero')),
    currency: Schema.Types.StringType().isRequired(t('memberPlanEdit.currencyRequired'))
  })

  async function saveMemberPlan() {
    if (!memberPlan) {
      return
    }

    const memberPlanInput = {
      name: memberPlan.name,
      slug: memberPlan.slug,
      tags: memberPlan.tags,
      imageID: memberPlan.image?.id || null,
      description: memberPlan.description,
      active: memberPlan.active,
      availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
        paymentPeriodicities: value.paymentPeriodicities,
        forceAutoRenewal: value.forceAutoRenewal,
        paymentMethodIDs: value.paymentMethods.map((pm: PaymentMethod) => pm.id)
      })),
      currency: memberPlan.currency,
      amountPerMonthMin: memberPlan.amountPerMonthMin,
      extendable: memberPlan.extendable,
      maxCount: memberPlan.maxCount,
      migrateToTargetPaymentMethodID: memberPlan.migrateToTargetPaymentMethodID,
      successPageId: memberPlan.successPageId,
      failPageId: memberPlan.failPageId
    } as MemberPlanInput

    // update member plan
    if (memberPlanId) {
      await updateMemberPlanMutation({
        variables: {
          id: memberPlanId,
          input: memberPlanInput
        },
        onCompleted: data => {
          toaster.push(
            <Message type="success" closable>
              {t('memberPlanEdit.savedChanges')}
            </Message>
          )
        }
      })
    } else {
      // create new member plan
      await createMemberPlanMutation({
        variables: {
          input: memberPlanInput
        },
        onCompleted: data => {
          toaster.push(
            <Message type="success" closable>
              {t('memberPlanEdit.savedChanges')}
            </Message>
          )
          navigate(`/memberplans/edit/${data.createMemberPlan?.id}`)
        }
      })
    }

    if (close) {
      navigate(closePath)
    }
  }

  return (
    <SingleView>
      <Form
        onSubmit={validationPassed => validationPassed && saveMemberPlan()}
        model={validationModel}
        fluid
        disabled={loading}
        formValue={{
          name: memberPlan?.name,
          slug: memberPlan?.slug,
          amountPerMonthMin: memberPlan?.amountPerMonthMin,
          currency: memberPlan?.currency
        }}>
        <SingleViewTitle
          loading={loading}
          loadingTitle={t('memberPlanEdit.loadingTitle')}
          title={header}
          saveBtnTitle={t('memberPlanEdit.saveBtnTitle')}
          saveAndCloseBtnTitle={t('memberPlanEdit.saveAndCloseBtnTitle')}
          closePath={closePath}
          setCloseFn={value => setClose(value)}
        />
        <SingleViewContent>
          <MemberPlanForm
            memberPlanId={memberPlanId}
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
