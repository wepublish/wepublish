import {Prisma} from '@prisma/client'

export const unselectPassword: Record<
  keyof Omit<
    Prisma.UserSelect,
    | '_count'
    | 'Comment'
    | 'Session'
    | 'Subscription'
    | 'Invoice'
    | 'CommentRating'
    | 'PollVote'
    | 'userImage'
    | 'UserConsent'
  >,
  boolean
> = {
  address: true,
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
  preferredName: true,
  flair: true,
  userImageID: true,
  password: false,
  active: true,
  lastLogin: true,
  roleIDs: true
} as const
