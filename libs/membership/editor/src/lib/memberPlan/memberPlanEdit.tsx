import React, {useEffect, useMemo, useState} from 'react'
import {SingleView} from '../../../../../ui/src/lib/singleView/singleView'
import {SingleViewTitle} from '../../../../../ui/src/lib/singleView/singleViewTitle'
import {SingleViewContent} from '../../../../../ui/src/lib/singleView/singleViewContent'
import {Link, useNavigate, useParams} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import {createCheckedPermissionComponent} from '../../../../../../apps/editor/src/app/atoms/permissionControl'
import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  PaymentMethod,
  useCreateMemberPlanMutation,
  useMemberPlanLazyQuery,
  usePaymentMethodListQuery,
  useUpdateMemberPlanMutation
} from '@wepublish/editor/api'
import {Col, Form, Message, Panel, Row, Schema, toaster} from 'rsuite'
import {generateID} from '../../../../../../apps/editor/src/app/utility'
import {ListValue} from '../../../../../../apps/editor/src/app/atoms/listInput'
import MemberPlanForm from './memberPlanForm'
import {ApolloError} from '@apollo/client'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

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

  /**
   * use effect hooks
   */
  useEffect(() => {
    if (!memberPlanId) {
      return
    }
    fetchMemberPlan({
      variables: {
        id: memberPlanId
      }
    })
  }, [])

  // initially set member plan and available payment methods
  useEffect(() => {
    const initMemberPlan = memberPlanData?.memberPlan || {
      id: 'dummy-id',
      availablePaymentMethods: [],
      description: [],
      amountPerMonthMin: 0,
      image: undefined,
      active: true,
      tags: [],
      slug: '',
      name: ''
    }
    setMemberPlan(initMemberPlan)
    setAvailablePaymentMethods(
      (initMemberPlan?.availablePaymentMethods || []).map(availablePaymentMethod => ({
        id: generateID(),
        value: availablePaymentMethod
      }))
    )
  }, [memberPlanData])

  /**
   * Memos
   */
  // indicate if any data is loading from api
  const loading: boolean = useMemo(() => {
    return memberPlanLoading || memberPlanUpdating || paymentMethodLoading || memberPlanCreating
  }, [memberPlanLoading, memberPlanUpdating, paymentMethodLoading, memberPlanCreating])

  const paymentMethods: FullPaymentMethodFragment[] = useMemo(() => {
    return paymentMethodData?.paymentMethods || []
  }, [paymentMethodData])

  const header: string = useMemo(() => {
    if (!memberPlanId) {
      return memberPlan?.name || t('memberPlanEdit.createMemberPlanHeader')
    }
    return memberPlan?.name || t('memberPlanEdit.noMemberPlanName')
  }, [memberPlanId, memberPlan?.name])

  /**
   * Schema validation
   */
  const validationModel = Schema.Model({
    name: Schema.Types.StringType().isRequired(t('memberPlanEdit.nameRequired')),
    slug: Schema.Types.StringType().isRequired(t('memberPlanEdit.slugRequired')),
    amountPerMonthMin: Schema.Types.NumberType()
      .isRequired(t('memberPlanEdit.amountPerMonthMinRequired'))
      .min(0, t('memberPlanEdit.amountPerMonthMinZero'))
  })

  /**
   * Functions
   */
  async function saveMemberPlan() {
    if (!memberPlan) {
      return
    }

    const memberPlanInput = {
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

    // update member plan
    if (memberPlanId) {
      await updateMemberPlanMutation({
        variables: {
          id: memberPlanId,
          input: memberPlanInput
        }
      })
    } else {
      // create new member plan
      await createMemberPlanMutation({
        variables: {
          input: memberPlanInput
        },
        onCompleted: data => {
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
          amountPerMonthMin: memberPlan?.amountPerMonthMin
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

          <Row>
            <Col xs={24}>
              <Panel bordered header={t('subscriptionFlow.settings')}>
                <Link to={`/communicationflows/edit/${memberPlanId}`}>
                  {t('subscriptionFlow.edit')}
                </Link>
              </Panel>
            </Col>
          </Row>
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
