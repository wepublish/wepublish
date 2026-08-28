import {
  MessageChannel,
  PaymentPeriodicity,
  SubscriptionEvent,
} from '@prisma/client';
import { LetterPrintSettings } from '@wepublish/letter/api';

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
  /** Which channels this step goes out through. */
  channels: MessageChannel[];
  /** Print options, used when the step includes the letter channel. */
  print: LetterPrintSettings;
};

/**
 * Whether a step goes out through a channel. A step without channels is read as
 * mail only: that is what every flow did before the letter channel existed, so
 * a row that predates the column keeps sending its mail.
 */
export function sendsThrough(action: Action, channel: MessageChannel): boolean {
  const channels =
    action.channels?.length ? action.channels : [MessageChannel.MAIL];

  return channels.includes(channel);
}

export type LookupActionInput = {
  memberplanId: string;
  paymentMethodId: string;
  periodicity: PaymentPeriodicity;
  autorenwal: boolean;
  daysAwayFromEnding?: number;

  events?: SubscriptionEvent[];
};
