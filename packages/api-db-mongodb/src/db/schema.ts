import {
  ArticleBlock,
  CommentItemType,
  CommentAuthorType,
  CommentRejectionReason,
  CommentState,
  AvailablePaymentMethod,
  FocalPoint,
  InvoiceItem,
  NavigationLink,
  PageBlock,
  PaymentProviderCustomer,
  RichTextNode,
  CommentRevision,
  MailLogState,
  PaymentState,
  UserAddress,
  UserOAuth2Account,
  PaymentPeriodicity,
  SubscriptionPeriod,
  SubscriptionDeactivation
} from '@wepublish/api'
import {MetadataProperty} from '@prisma/client'

export enum CollectionName {
  Migrations = 'migrations',

  PeerProfiles = 'peerProfiles',
  Peers = 'peers',
  Users = 'users',
  UserRoles = 'users.roles',
  Subscriptions = 'subscriptions',

  Sessions = 'sessions',
  Tokens = 'tokens',

  Navigations = 'navigations',
  Authors = 'authors',
  Images = 'images',

  Comments = 'comments',

  Articles = 'articles',
  ArticlesHistory = 'articles.history',

  Pages = 'pages',
  PagesHistory = 'pages.history',

  MemberPlans = 'member.plans',
  PaymentMethods = 'payment.methods',
  Invoices = 'invoices',
  Payments = 'payments',

  MailLog = 'mail.log'
}

// NOTE: _id has to be of type any for insert operations not requiring _id to be provided.
export interface DBMigration {
  _id: any
  version: number
  createdAt: Date
}

export interface DBPeerProfile {
  _id: any

  name: string
  logoID?: string | null
  themeColor: string
  themeFontColor: string
  callToActionURL: string
  callToActionText: RichTextNode[]
  callToActionImageURL?: string | null
  callToActionImageID?: string | null
}

export interface DBPeer {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  slug: string
  isDisabled?: boolean
  hostURL: string
  token: string
}

export interface DBToken {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  token: string

  roleIDs: string[]
}

export interface DBUser {
  _id: any

  createdAt: Date
  modifiedAt: Date

  email: string
  emailVerifiedAt: Date | null
  name: string
  firstName?: string | null
  preferredName?: string | null
  address?: UserAddress | null
  password: string

  oauth2Accounts: UserOAuth2Account[]

  active: boolean
  lastLogin: Date | null

  properties: MetadataProperty[]

  roleIDs: string[]

  paymentProviderCustomers: PaymentProviderCustomer[]
}

export interface DBUserRole {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  description?: string | null
  systemRole: boolean

  permissionIDs: string[]
}

export interface DBSubscription {
  _id: any

  createdAt: Date
  modifiedAt: Date

  userID: string
  memberPlanID: string
  paymentPeriodicity: PaymentPeriodicity
  monthlyAmount: number
  autoRenew: boolean
  startsAt: Date
  paidUntil: Date | null
  periods: SubscriptionPeriod[]
  paymentMethodID: string
  properties: MetadataProperty[]
  deactivation: SubscriptionDeactivation | null
}

export interface DBSession {
  _id: any

  createdAt: Date
  expiresAt: Date

  userID: string
  token: string
}

export interface DBNavigation {
  _id: any

  createdAt: Date
  modifiedAt: Date

  key: string
  name: string
  links: NavigationLink[]
}

export interface DBAuthor {
  _id: any

  createdAt: Date
  modifiedAt: Date

  slug: string
  name: string
  jobTitle?: string | null
  imageID?: string | null

  links: Array<{title: string; url: string}>
  bio: RichTextNode[]
}

// TODO: Consider using DB schema via $jsonSchema
// export const DBUserSchema = {
//   bsonType: 'object',
//   additionalProperties: false,
//   required: ['_id', 'email', 'password'],
//   properties: {
//     _id: {bsonType: 'string'},
//     email: {bsonType: 'string'},
//     password: {bsonType: 'string'}
//   }
// }
//
// const users = await db.createCollection<v0.DBUser>(v0.CollectionName.Users, {
//   validator: {
//     $jsonSchema: v0.DBUserSchema
//   },
//   strict: true
// })

export interface DBImage {
  _id: any

  createdAt: Date
  modifiedAt: Date

  fileSize: number
  extension: string
  mimeType: string
  format: string
  width: number
  height: number

  filename?: string | null
  title?: string | null
  description?: string | null
  tags: string[]

  source?: string | null
  link?: string | null
  license?: string | null

  focalPoint?: FocalPoint | null
}

export interface DBComment {
  _id: any

  createdAt: Date
  modifiedAt: Date

  itemID: string
  itemType: CommentItemType

  userID?: string | null

  revisions: CommentRevision[]
  parentID?: string | null

  state: CommentState
  rejectionReason?: CommentRejectionReason | null
  authorType: CommentAuthorType
}

export interface DBArticle {
  _id: any

  shared: boolean
  createdAt: Date
  modifiedAt: Date

  draft: DBArticleRevision | null
  published: DBArticleRevision | null
  pending: DBArticleRevision | null
}

export interface DBArticleRevision {
  revision: number
  createdAt: Date

  updatedAt?: Date | null
  publishedAt?: Date | null
  publishAt?: Date | null

  slug?: string | null
  preTitle?: string | null
  title?: string | null
  lead?: string | null
  seoTitle?: string | null
  tags: string[]

  properties: MetadataProperty[]

  imageID?: string | null
  authorIDs: string[]

  breaking: boolean
  blocks: ArticleBlock[]

  hideAuthor: boolean

  socialMediaTitle?: string | null
  socialMediaDescription?: string | null
  socialMediaAuthorIDs: string[]
  socialMediaImageID?: string | null
}

export interface DBArticleHistoryRevision extends DBArticleRevision {
  _id: any
  articleID: string
}

export interface DBPage {
  _id: any

  createdAt: Date
  modifiedAt: Date

  draft: DBPageRevision | null
  published: DBPageRevision | null
  pending: DBPageRevision | null
}

export interface DBPageRevision {
  revision: number
  createdAt: Date

  updatedAt?: Date | null
  publishedAt?: Date | null
  publishAt?: Date | null

  slug: string

  title: string
  description?: string | null
  tags: string[]

  properties: MetadataProperty[]

  imageID?: string | null

  socialMediaTitle?: string | null
  socialMediaDescription?: string | null
  socialMediaImageID?: string | null

  blocks: PageBlock[]
}

export interface DBPageHistoryRevision extends DBPageRevision {
  _id: any
  articleID: string
}

export interface DBMemberPlan {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  slug: string
  tags: string[]
  imageID?: string | null
  description: RichTextNode[]
  active: boolean
  amountPerMonthMin: number
  availablePaymentMethods: AvailablePaymentMethod[]
}

export interface DBPaymentMethod {
  _id: any

  createdAt: Date
  modifiedAt: Date

  name: string
  slug: string
  description: string
  paymentProviderID: string
  active: boolean
}

export interface DBInvoice {
  _id: any

  createdAt: Date
  modifiedAt: Date

  mail: string
  dueAt: Date
  subscriptionID: string
  description?: string | null
  paidAt: Date | null
  canceledAt: Date | null
  sentReminderAt?: Date | null
  items: InvoiceItem[]
  manuallySetAsPaidByUserId?: string | null
  userID?: string | null
}

export interface DBPayment {
  _id: any

  createdAt: Date
  modifiedAt: Date

  invoiceID: string
  state: PaymentState
  paymentMethodID: string

  intentID?: string | null
  intentSecret?: string | null
  intentData?: string | null

  paymentData?: string | null
}

export interface DBMailLog {
  _id: any

  createdAt: Date
  modifiedAt: Date

  recipient: string
  subject: string
  state: MailLogState
  mailProviderID: string
  mailData?: string | null
}
