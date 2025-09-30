import { MemberPlan, PaymentState, Subscription, User } from '@prisma/client';
import Bexio, { ContactsStatic } from 'bexio';
import { MappedReplacer } from 'mapped-replacer/dist/types';

const { ContactSearchParameters } = ContactsStatic;

export enum BexioInvoiceStatus {
  Draft = 7,
  Pending = 8,
  Paid = 9,
  Partial = 16,
  Canceled = 19,
  Unpaid = 31,
}

export async function searchForContact(bexio: Bexio, user: User) {
  const contacts = await bexio.contacts.search([
    {
      field: ContactSearchParameters.mail,
      value: `${user.email}`,
      criteria: '=',
    },
  ]);
  return contacts[0];
}

export async function addToStringReplaceMap(
  stringReplaceMap: MappedReplacer,
  id: string,
  object: User | Subscription | MemberPlan
) {
  for (const [key, value] of Object.entries(object)) {
    stringReplaceMap.addRule(`:${id}.${key}:`, `${value}`);
  }
}

export function mapBexioStatusToPaymentStatus(
  bexioStatus: BexioInvoiceStatus
): PaymentState | null {
  switch (bexioStatus) {
    case BexioInvoiceStatus.Unpaid:
    case BexioInvoiceStatus.Partial:
    case BexioInvoiceStatus.Draft:
      return PaymentState.requiresUserAction;
    case BexioInvoiceStatus.Pending:
      return PaymentState.processing;
    case BexioInvoiceStatus.Paid:
      return PaymentState.paid;
    case BexioInvoiceStatus.Canceled:
      return PaymentState.canceled;
    default:
      return null;
  }
}
