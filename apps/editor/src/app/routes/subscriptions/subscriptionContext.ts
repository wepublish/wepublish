import type {
  ActionMailDecision,
  ActionMailQuestion,
} from '@wepublish/ui/editor';
import { createContext, useContext } from 'react';

import type { LoadedSubscription } from './subscription.schema';

export type SubscriptionContextValue = {
  readonly subscription: LoadedSubscription | null;
  readonly deactivated: boolean;
  readonly reload: () => void;
  readonly askMail: (question: ActionMailQuestion) => Promise<ActionMailDecision>;
};

const askNothing = async (): Promise<ActionMailDecision> => 'cancel';

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  deactivated: false,
  reload: () => undefined,
  askMail: askNothing,
});

export const useSubscription = () => useContext(SubscriptionContext);
