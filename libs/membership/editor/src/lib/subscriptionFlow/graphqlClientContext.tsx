/* eslint-disable @typescript-eslint/no-explicit-any */
import {MutationFunctionOptions} from '@apollo/client'
import {
  CreateSubscriptionFlowMutation,
  CreateSubscriptionIntervalMutation,
  DeleteSubscriptionFlowMutation,
  DeleteSubscriptionIntervalMutation,
  Exact,
  SubscriptionFlowModelCreateInput,
  SubscriptionFlowModelUpdateInput,
  SubscriptionIntervalCreateInput,
  SubscriptionIntervalDeleteInput,
  SubscriptionIntervalUpdateInput,
  UpdateSubscriptionFlowMutation,
  UpdateSubscriptionIntervalMutation,
  UpdateSubscriptionIntervalsMutation
} from '@wepublish/editor/api-v2'
import {createContext} from 'react'

export const GraphqlClientContext = createContext({
  createSubscriptionInterval: (
    options: MutationFunctionOptions<
      CreateSubscriptionIntervalMutation,
      Exact<{subscriptionInterval: SubscriptionIntervalCreateInput}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  updateSubscriptionInterval: (
    options: MutationFunctionOptions<
      UpdateSubscriptionIntervalMutation,
      Exact<{subscriptionInterval: SubscriptionIntervalUpdateInput}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  updateSubscriptionIntervals: (
    options: MutationFunctionOptions<
      UpdateSubscriptionIntervalsMutation,
      Exact<{
        subscriptionIntervals: SubscriptionIntervalUpdateInput | SubscriptionIntervalUpdateInput[]
      }>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  deleteSubscriptionInterval: (
    options: MutationFunctionOptions<
      DeleteSubscriptionIntervalMutation,
      Exact<{subscriptionInterval: SubscriptionIntervalDeleteInput}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  createSubscriptionFlow: (
    options: MutationFunctionOptions<
      CreateSubscriptionFlowMutation,
      Exact<{subscriptionFlow: SubscriptionFlowModelCreateInput}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  updateSubscriptionFlow: (
    options: MutationFunctionOptions<
      UpdateSubscriptionFlowMutation,
      Exact<{subscriptionFlow: SubscriptionFlowModelUpdateInput}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  },
  deleteSubscriptionFlow: (
    options: MutationFunctionOptions<
      DeleteSubscriptionFlowMutation,
      Exact<{subscriptionFlowId: string}>
    >
  ): Promise<any> => {
    throw new Error('Default context must be overriden!')
  }
})
