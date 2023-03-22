import React, {useMemo, useState} from 'react'
import {TableCell} from '@mui/material'
import {CheckPicker, IconButton} from 'rsuite'
import {
  PaymentPeriodicity,
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  useCreateSubscriptionFlowMutation,
  useListPaymentMethodsQuery,
  useUpdateSubscriptionFlowMutation
} from '@wepublish/editor/api-v2'
import {ApolloClient, NormalizedCacheObject} from '@apollo/client'
import {getApiClientV2} from 'app/utility'
import {showErrors} from '../subscriptionFlowList'
import {MdAdd} from 'react-icons/all'
import {FullMemberPlanFragment} from '@wepublish/editor/api'
import {useTranslation} from 'react-i18next'
import {useAuthorisation} from 'app/atoms/permissionControl'

interface FilterBodyProps {
  memberPlan?: FullMemberPlanFragment
  subscriptionFlow?: SubscriptionFlowModel
  defaultFlowOnly?: boolean
  createNewFlow?: boolean
  onNewFlowCreated?: () => void
}
export default function ({
  subscriptionFlow,
  defaultFlowOnly,
  memberPlan,
  createNewFlow,
  onNewFlowCreated
}: FilterBodyProps) {
  if (defaultFlowOnly || !memberPlan) {
    return null
  }

  const {t} = useTranslation()
  const canUpdateSubscriptionFlow = useAuthorisation('CAN_UPDATE_SUBSCRIPTION_FLOW')
  const [newFlow, setNewFlow] = useState<SubscriptionFlowModelCreateInput>({
    autoRenewal: [],
    periodicities: [],
    paymentMethodIds: [],
    memberPlanId: memberPlan.id
  })

  /******************************************
   * API SERVICES
   ******************************************/
  const client: ApolloClient<NormalizedCacheObject> = useMemo(() => getApiClientV2(), [])

  // get payment methods
  const {data: paymentMethods, loading: loadingPaymentMethods} = useListPaymentMethodsQuery({
    client,
    onError: showErrors
  })

  const [updateSubscriptionFlow] = useUpdateSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  const [createSubscriptionFlow] = useCreateSubscriptionFlowMutation({
    client,
    onError: showErrors
  })

  /******************************************
   * HELPER METHODS
   ******************************************/
  async function createOrUpdateFlow(payload: Partial<SubscriptionFlowModelUpdateInput>) {
    if (createNewFlow) {
      updateNewFlow(payload)
    } else {
      await updateFlow(payload)
    }
  }

  function updateNewFlow(payload: Partial<SubscriptionFlowModelUpdateInput>) {
    setNewFlow({
      memberPlanId: newFlow.memberPlanId,
      paymentMethodIds: payload.paymentMethodIds || newFlow.paymentMethodIds,
      periodicities: payload.periodicities || newFlow.periodicities,
      autoRenewal: payload.autoRenewal || newFlow.autoRenewal
    })
  }

  async function saveNewFlow() {
    await createSubscriptionFlow({
      variables: {
        subscriptionFlow: newFlow
      }
    })
    if (onNewFlowCreated) {
      onNewFlowCreated()
    }
  }

  async function updateFlow(payload: Partial<SubscriptionFlowModelUpdateInput>) {
    if (!subscriptionFlow) {
      return
    }
    const mutation: SubscriptionFlowModelUpdateInput = {
      id: subscriptionFlow.id,
      paymentMethodIds:
        payload.paymentMethodIds || subscriptionFlow.paymentMethods.map(pm => pm.id),
      periodicities: payload.periodicities || subscriptionFlow.periodicities,
      autoRenewal: payload.autoRenewal || subscriptionFlow.autoRenewal
    }

    await updateSubscriptionFlow({
      variables: {
        subscriptionFlow: mutation
      }
    })
  }

  return (
    <>
      <TableCell align="center">{!subscriptionFlow?.default && memberPlan.name}</TableCell>
      <TableCell align="center">
        {paymentMethods && paymentMethods.paymentMethods && (
          <CheckPicker
            data={paymentMethods.paymentMethods.map(method => ({
              label: method.name,
              value: method.id
            }))}
            disabled={
              subscriptionFlow?.default || loadingPaymentMethods || !canUpdateSubscriptionFlow
            }
            countable={false}
            cleanable={false}
            defaultValue={subscriptionFlow?.paymentMethods.map(m => m.id)}
            onChange={v => createOrUpdateFlow({paymentMethodIds: v})}
          />
        )}
      </TableCell>
      <TableCell align="center">
        <CheckPicker
          data={Object.values(PaymentPeriodicity).map(item => ({
            label: item,
            value: item
          }))}
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow?.periodicities || []}
          onChange={v => createOrUpdateFlow({periodicities: v})}
        />
      </TableCell>
      <TableCell align="center">
        <CheckPicker
          data={[true, false].map(item => ({
            label: t(`subscriptionFlow.booleanFilter.${item}`),
            value: item
          }))}
          disabled={subscriptionFlow?.default || !canUpdateSubscriptionFlow}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow?.autoRenewal || []}
          onChange={v => createOrUpdateFlow({autoRenewal: v})}
        />
      </TableCell>

      {createNewFlow && (
        <TableCell>
          <IconButton
            icon={<MdAdd />}
            color={'green'}
            appearance={'primary'}
            onClick={() => saveNewFlow()}>
            {t('subscriptionFlow.addNew')}
          </IconButton>
        </TableCell>
      )}
    </>
  )
}
