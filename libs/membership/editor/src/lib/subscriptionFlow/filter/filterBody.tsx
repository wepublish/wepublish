import React, {useMemo} from 'react'
import {TableCell} from '@mui/material'
import {CheckPicker} from 'rsuite'
import {
  PaymentPeriodicity,
  SubscriptionFlowFragment,
  SubscriptionFlowModel,
  SubscriptionFlowModelUpdateInput,
  useListPaymentMethodsQuery,
  useUpdateSubscriptionFlowMutation
} from '@wepublish/editor/api-v2'
import {ApolloClient, NormalizedCacheObject} from '@apollo/client'
import {getApiClientV2} from '../../../../../../../apps/editor/src/app/utility'
import {showErrors} from '../subscriptionFlowList'

interface FilterBodyProps {
  subscriptionFlow: SubscriptionFlowModel
  defaultFlowOnly?: boolean
}
export default function ({subscriptionFlow, defaultFlowOnly}: FilterBodyProps) {
  if (defaultFlowOnly) {
    return null
  }

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

  /******************************************
   * HELPER METHODS
   ******************************************/
  const updateFlow = async function (
    subscriptionFlow: SubscriptionFlowFragment,
    payload: Partial<SubscriptionFlowModelUpdateInput>
  ) {
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
      <TableCell align="center">{subscriptionFlow.memberPlan?.name}</TableCell>
      <TableCell align="center">
        {paymentMethods && paymentMethods.paymentMethods && (
          <CheckPicker
            data={paymentMethods.paymentMethods.map(method => ({
              label: method.name,
              value: method.id
            }))}
            disabled={subscriptionFlow.default || loadingPaymentMethods}
            countable={false}
            cleanable={false}
            defaultValue={subscriptionFlow.paymentMethods.map(m => m.id)}
            onChange={v => updateFlow(subscriptionFlow, {paymentMethodIds: v})}
          />
        )}
      </TableCell>
      <TableCell align="center">
        <CheckPicker
          data={Object.values(PaymentPeriodicity).map(item => ({
            label: item,
            value: item
          }))}
          disabled={subscriptionFlow.default}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow.periodicities}
          onChange={v => updateFlow(subscriptionFlow, {periodicities: v})}
        />
      </TableCell>
      <TableCell align="center">
        <CheckPicker
          data={[true, false].map(item => ({
            label: item.toString(),
            value: item
          }))}
          disabled={subscriptionFlow.default}
          countable={false}
          cleanable={false}
          defaultValue={subscriptionFlow.autoRenewal}
          onChange={v => updateFlow(subscriptionFlow, {autoRenewal: v})}
        />
      </TableCell>
    </>
  )
}
