import {
  useCreateSubscriptionFlowMutation,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionIntervalMutation,
  useUpdateSubscriptionFlowMutation,
  useUpdateSubscriptionIntervalMutation,
} from '@wepublish/editor/api';
import { createContext } from 'react';

export const SubscriptionClientContext = createContext({
  createSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useCreateSubscriptionIntervalMutation>[0],
  updateSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useUpdateSubscriptionIntervalMutation>[0],
  deleteSubscriptionInterval: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useDeleteSubscriptionIntervalMutation>[0],
  createSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useCreateSubscriptionFlowMutation>[0],
  updateSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useUpdateSubscriptionFlowMutation>[0],
  deleteSubscriptionFlow: (() => {
    throw new Error('Default context must be overriden!');
  }) as ReturnType<typeof useDeleteSubscriptionFlowMutation>[0],
});
