import { useMutation } from '@apollo/client/react';
import {
  CreateSubscriptionFlowMutation,
  CreateSubscriptionFlowMutationVariables,
  CreateSubscriptionIntervalMutation,
  CreateSubscriptionIntervalMutationVariables,
  DeleteSubscriptionFlowMutation,
  DeleteSubscriptionFlowMutationVariables,
  DeleteSubscriptionIntervalMutation,
  DeleteSubscriptionIntervalMutationVariables,
  UpdateSubscriptionFlowMutation,
  UpdateSubscriptionFlowMutationVariables,
  UpdateSubscriptionIntervalMutation,
  UpdateSubscriptionIntervalMutationVariables,
} from '@wepublish/editor/api';
import { createContext } from 'react';

export const SubscriptionClientContext = createContext({
  createSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    CreateSubscriptionIntervalMutation,
    CreateSubscriptionIntervalMutationVariables
  >,
  updateSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    UpdateSubscriptionIntervalMutation,
    UpdateSubscriptionIntervalMutationVariables
  >,
  deleteSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    DeleteSubscriptionIntervalMutation,
    DeleteSubscriptionIntervalMutationVariables
  >,
  createSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    CreateSubscriptionFlowMutation,
    CreateSubscriptionFlowMutationVariables
  >,
  updateSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    UpdateSubscriptionFlowMutation,
    UpdateSubscriptionFlowMutationVariables
  >,
  deleteSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as useMutation.MutationFunction<
    DeleteSubscriptionFlowMutation,
    DeleteSubscriptionFlowMutationVariables
  >,
});
