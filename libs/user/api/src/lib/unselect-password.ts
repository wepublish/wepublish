import {Prisma} from '@prisma/client'

export const unselectPassword: Record<
  keyof Omit<
    Prisma.UserSelect,
    | '_count'
    | 'comments'
    | 'sessions'
    | 'subscriptions'
    | 'invoices'
    | 'commentRatings'
    | 'pollVotes'
    | 'userImage'
    | 'consents'
    | 'mailSent'
    | 'articleRevisions'
    | 'pageRevisions'
    | 'internalNote'
  >,
  boolean
> = {
  address: true,
  birthday: true,
  oauth2Accounts: true,
  properties: true,
  paymentProviderCustomers: true,
  id: true,
  createdAt: true,
  modifiedAt: true,
  email: true,
  emailVerifiedAt: true,
  name: true,
  firstName: true,
  flair: true,
  userImageID: true,
  password: false,
  active: true,
  lastLogin: true,
  roleIDs: true
} as const
