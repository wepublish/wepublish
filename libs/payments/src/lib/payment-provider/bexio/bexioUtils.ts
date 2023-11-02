import {MemberPlan, PaymentState, Subscription, User} from '@prisma/client'
import Bexio, {ContactsStatic} from 'bexio'
import {MappedReplacer} from 'mapped-replacer/dist/types'

const {ContactSearchParameters} = ContactsStatic

export type BexioInvoiceStatus = 7 | 8 | 9 | 16 | 19 | 31

export async function searchForContact(bexio: Bexio, user: User) {
  const contacts = await bexio.contacts.search([
    {
      field: ContactSearchParameters.mail,
      value: `${user.email}`,
      criteria: '='
    }
  ])
  return contacts[0]
}

export async function addToStringReplaceMap(
  stringReplaceMap: MappedReplacer,
  id: string,
  object: User | Subscription | MemberPlan
) {
  for (const [key, value] of Object.entries(object)) {
    stringReplaceMap.addRule(`:${id}.${key}:`, `${value}`)
  }
}

export function mapBexioStatusToPaymentStatus(
  bexioStatus: BexioInvoiceStatus
): PaymentState | null {
  switch (bexioStatus) {
    case 31: // unpaid
    case 16: // partial
    case 7: // draft
      return PaymentState.requiresUserAction
    case 8: //pending
      return PaymentState.processing
    case 9: // paid
      return PaymentState.paid
    case 19: // cancelled
      return PaymentState.canceled
    default:
      return null
  }
}
