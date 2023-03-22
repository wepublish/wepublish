import React, {useContext, useState} from 'react'
import {TableCell} from '@mui/material'
import {CheckPicker, IconButton} from 'rsuite'
import {
  ListPaymentMethodsQuery,
  PaymentPeriodicity,
  SubscriptionFlowModel,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
} from '@wepublish/editor/api-v2'
import {MdAdd} from 'react-icons/all'
import {FullMemberPlanFragment} from '@wepublish/editor/api'
import {useTranslation} from 'react-i18next'
import {useAuthorisation} from '../../../../../../../apps/editor/src/app/atoms/permissionControl'
import { GraphqlClientContext } from '../graphqlClientContext'

interface FilterBodyProps {
  memberPlan?: FullMemberPlanFragment
  subscriptionFlow?: SubscriptionFlowModel
  defaultFlowOnly?: boolean
  createNewFlow?: boolean
  onNewFlowCreated?: () => void
  paymentMethods: ListPaymentMethodsQuery | undefined
}
export default function ({
  subscriptionFlow,
  defaultFlowOnly,
  memberPlan,
  createNewFlow,
  onNewFlowCreated,
  paymentMethods
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

  const client = useContext(GraphqlClientContext)

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
    await client.createSubscriptionFlow({
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

    await client.updateSubscriptionFlow({
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
              subscriptionFlow?.default || paymentMethods.paymentMethods.length === 0 || !canUpdateSubscriptionFlow
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
