import { PaymentPeriodicity, SubscriptionEvent } from '@prisma/client';

export type Store = {
  defaultFlow: Action[];
  customFlow: StoreMemberPlan;
};

export type StoreMemberPlan = {
  [key: string]: StorePaymentMethode;
};

type StorePaymentMethode = {
  [key: string]: StorePeriodicites;
};

type StorePeriodicites = {
  [key in PaymentPeriodicity]?: StoreAutoRenewal;
};

type StoreAutoRenewal = {
  [key: string]: Action[];
};

export type Action = {
  type: SubscriptionEvent;
  daysAwayFromEnding: number | null;
  mailTemplateId: string | null;
  /** Users in letter mode get this event printed instead of mailed. */
  sendAsLetter: boolean;
};

/** The template an event of a subscription uses, and whether it prints. */
export type TemplateAction = Pick<Action, 'sendAsLetter'> & {
  mailTemplateId: string;
};

export type LookupActionInput = {
  memberplanId: string;
  paymentMethodId: string;
  periodicity: PaymentPeriodicity;
  autorenwal: boolean;
  daysAwayFromEnding?: number;

  events?: SubscriptionEvent[];
};
