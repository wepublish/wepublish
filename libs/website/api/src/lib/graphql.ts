// THIS FILE IS AUTOGENERATED, EDIT WITH CAUTION
import {Node} from 'slate'
import {gql} from '@apollo/client'
import * as Apollo from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends {[key: string]: unknown}> = {[K in keyof T]: T[K]}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {[SubKey in K]?: Maybe<T[SubKey]>}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {[SubKey in K]: Maybe<T[SubKey]>}
const defaultOptions = {} as const
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  Color: string
  Date: string
  DateTime: string
  RichText: Node[]
  Slug: string
  Upload: File
  VoteValue: number
}

export type Article = {
  __typename?: 'Article'
  authors: Array<Maybe<Author>>
  blocks: Array<Block>
  breaking: Scalars['Boolean']
  canonicalUrl?: Maybe<Scalars['String']>
  comments: Array<Comment>
  id: Scalars['ID']
  image?: Maybe<Image>
  lead?: Maybe<Scalars['String']>
  preTitle?: Maybe<Scalars['String']>
  properties: Array<PublicProperties>
  publishedAt: Scalars['DateTime']
  seoTitle?: Maybe<Scalars['String']>
  slug: Scalars['Slug']
  socialMediaAuthors: Array<Author>
  socialMediaDescription?: Maybe<Scalars['String']>
  socialMediaImage?: Maybe<Image>
  socialMediaTitle?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  title: Scalars['String']
  updatedAt: Scalars['DateTime']
  url: Scalars['String']
}

export type ArticleConnection = {
  __typename?: 'ArticleConnection'
  nodes: Array<Article>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type ArticleFilter = {
  authors?: InputMaybe<Array<Scalars['ID']>>
  tags?: InputMaybe<Array<Scalars['String']>>
}

export type ArticleNavigationLink = BaseNavigationLink & {
  __typename?: 'ArticleNavigationLink'
  article?: Maybe<Article>
  label: Scalars['String']
}

export enum ArticleSort {
  PublishedAt = 'PUBLISHED_AT',
  UpdatedAt = 'UPDATED_AT'
}

export type ArticleTeaser = {
  __typename?: 'ArticleTeaser'
  article?: Maybe<Article>
  image?: Maybe<Image>
  lead?: Maybe<Scalars['String']>
  preTitle?: Maybe<Scalars['String']>
  style: TeaserStyle
  title?: Maybe<Scalars['String']>
}

export type AuthProvider = {
  __typename?: 'AuthProvider'
  name: Scalars['String']
  url: Scalars['String']
}

export type Author = {
  __typename?: 'Author'
  bio?: Maybe<Scalars['RichText']>
  createdAt: Scalars['DateTime']
  id: Scalars['ID']
  image?: Maybe<Image>
  jobTitle?: Maybe<Scalars['String']>
  links?: Maybe<Array<AuthorLink>>
  modifiedAt: Scalars['DateTime']
  name: Scalars['String']
  slug: Scalars['Slug']
  url: Scalars['String']
}

export type AuthorConnection = {
  __typename?: 'AuthorConnection'
  nodes: Array<Author>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type AuthorFilter = {
  name?: InputMaybe<Scalars['String']>
}

export type AuthorLink = {
  __typename?: 'AuthorLink'
  title: Scalars['String']
  url: Scalars['String']
}

export enum AuthorSort {
  CreatedAt = 'CREATED_AT',
  ModifiedAt = 'MODIFIED_AT',
  Name = 'NAME'
}

export type AvailablePaymentMethod = {
  __typename?: 'AvailablePaymentMethod'
  forceAutoRenewal: Scalars['Boolean']
  paymentMethods: Array<PaymentMethod>
  paymentPeriodicities: Array<PaymentPeriodicity>
}

export type BaseNavigationLink = {
  label: Scalars['String']
}

export type BildwurfAdBlock = {
  __typename?: 'BildwurfAdBlock'
  zoneID: Scalars['String']
}

export type Block =
  | BildwurfAdBlock
  | CommentBlock
  | EmbedBlock
  | EventBlock
  | FacebookPostBlock
  | HtmlBlock
  | ImageBlock
  | ImageGalleryBlock
  | InstagramPostBlock
  | LinkPageBreakBlock
  | ListicleBlock
  | PolisConversationBlock
  | PollBlock
  | QuoteBlock
  | RichTextBlock
  | SoundCloudTrackBlock
  | TeaserGridBlock
  | TeaserGridFlexBlock
  | TikTokVideoBlock
  | TitleBlock
  | TwitterTweetBlock
  | VimeoVideoBlock
  | YouTubeVideoBlock

export type CalculatedRating = {
  __typename?: 'CalculatedRating'
  answer?: Maybe<CommentRatingSystemAnswer>
  count: Scalars['Int']
  mean: Scalars['Float']
  total: Scalars['Int']
}

export type Challenge = {
  __typename?: 'Challenge'
  challenge?: Maybe<Scalars['String']>
  challengeID?: Maybe<Scalars['String']>
  validUntil?: Maybe<Scalars['Date']>
}

export type ChallengeInput = {
  challengeID: Scalars['String']
  challengeSolution: Scalars['String']
}

export type Comment = {
  __typename?: 'Comment'
  authorType: CommentAuthorType
  calculatedRatings?: Maybe<Array<Maybe<CalculatedRating>>>
  children?: Maybe<Array<Maybe<Comment>>>
  createdAt: Scalars['DateTime']
  guestUserImage?: Maybe<Image>
  guestUsername?: Maybe<Scalars['String']>
  id: Scalars['ID']
  itemID: Scalars['ID']
  itemType: CommentItemType
  lead?: Maybe<Scalars['String']>
  modifiedAt: Scalars['DateTime']
  overriddenRatings: Array<OverriddenRating>
  parentID?: Maybe<Scalars['ID']>
  peerId?: Maybe<Scalars['ID']>
  rejectionReason?: Maybe<Scalars['String']>
  source?: Maybe<Scalars['String']>
  state: CommentState
  tags?: Maybe<Array<Tag>>
  text?: Maybe<Scalars['RichText']>
  title?: Maybe<Scalars['String']>
  user?: Maybe<User>
}

export enum CommentAuthorType {
  Author = 'Author',
  GuestUser = 'GuestUser',
  Team = 'Team',
  VerifiedUser = 'VerifiedUser'
}

export type CommentBlock = {
  __typename?: 'CommentBlock'
  comments: Array<Comment>
}

export type CommentInput = {
  challenge?: InputMaybe<ChallengeInput>
  guestUsername?: InputMaybe<Scalars['String']>
  itemID: Scalars['ID']
  itemType: CommentItemType
  parentID?: InputMaybe<Scalars['ID']>
  peerId?: InputMaybe<Scalars['ID']>
  text: Scalars['RichText']
  title?: InputMaybe<Scalars['String']>
}

export enum CommentItemType {
  Article = 'Article',
  Page = 'Page',
  PeerArticle = 'PeerArticle'
}

export type CommentRating = {
  __typename?: 'CommentRating'
  answer?: Maybe<CommentRatingSystemAnswer>
  commentId: Scalars['ID']
  createdAt: Scalars['DateTime']
  disabled?: Maybe<Scalars['Boolean']>
  fingerprint?: Maybe<Scalars['String']>
  id: Scalars['ID']
  userId?: Maybe<Scalars['ID']>
  value?: Maybe<Scalars['Int']>
}

export type CommentRatingSystemAnswer = {
  __typename?: 'CommentRatingSystemAnswer'
  answer?: Maybe<Scalars['String']>
  id: Scalars['ID']
  ratingSystemId: Scalars['ID']
  type: RatingSystemType
}

export enum CommentSort {
  Rating = 'RATING'
}

export enum CommentState {
  Approved = 'Approved',
  PendingApproval = 'PendingApproval',
  PendingUserChanges = 'PendingUserChanges',
  Rejected = 'Rejected'
}

export type CommentUpdateInput = {
  id: Scalars['ID']
  text: Scalars['RichText']
}

export type CustomTeaser = {
  __typename?: 'CustomTeaser'
  contentUrl?: Maybe<Scalars['String']>
  image?: Maybe<Image>
  lead?: Maybe<Scalars['String']>
  preTitle?: Maybe<Scalars['String']>
  properties: Array<PublicProperties>
  style: TeaserStyle
  title?: Maybe<Scalars['String']>
}

export type EmbedBlock = {
  __typename?: 'EmbedBlock'
  height?: Maybe<Scalars['Int']>
  sandbox?: Maybe<Scalars['String']>
  styleCustom?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
  url?: Maybe<Scalars['String']>
  width?: Maybe<Scalars['Int']>
}

export type Event = {
  __typename?: 'Event'
  description?: Maybe<Scalars['RichText']>
  endsAt?: Maybe<Scalars['DateTime']>
  externalSourceId?: Maybe<Scalars['String']>
  externalSourceName?: Maybe<Scalars['String']>
  id: Scalars['ID']
  image?: Maybe<Image>
  location?: Maybe<Scalars['String']>
  name: Scalars['String']
  startsAt: Scalars['DateTime']
  status: EventStatus
  tags?: Maybe<Array<Tag>>
}

export type EventBlock = {
  __typename?: 'EventBlock'
  events: Array<Event>
  filter: EventBlockFilter
}

export type EventBlockFilter = {
  __typename?: 'EventBlockFilter'
  events?: Maybe<Array<Scalars['ID']>>
  tags?: Maybe<Array<Scalars['ID']>>
}

export type EventConnection = {
  __typename?: 'EventConnection'
  nodes: Array<Event>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type EventFilter = {
  from?: InputMaybe<Scalars['DateTime']>
  tags?: InputMaybe<Array<Scalars['ID']>>
  to?: InputMaybe<Scalars['DateTime']>
  upcomingOnly?: InputMaybe<Scalars['Boolean']>
}

export enum EventSort {
  CreatedAt = 'CREATED_AT',
  EndsAt = 'ENDS_AT',
  ModifiedAt = 'MODIFIED_AT',
  StartsAt = 'STARTS_AT'
}

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Postponed = 'POSTPONED',
  Rescheduled = 'RESCHEDULED',
  Scheduled = 'SCHEDULED'
}

export type ExternalNavigationLink = BaseNavigationLink & {
  __typename?: 'ExternalNavigationLink'
  label: Scalars['String']
  url: Scalars['String']
}

export type FacebookPostBlock = {
  __typename?: 'FacebookPostBlock'
  postID: Scalars['String']
  userID: Scalars['String']
}

export type FlexAlignment = {
  __typename?: 'FlexAlignment'
  h: Scalars['Int']
  w: Scalars['Int']
  x: Scalars['Int']
  y: Scalars['Int']
}

export type FlexTeaser = {
  __typename?: 'FlexTeaser'
  alignment: FlexAlignment
  teaser?: Maybe<Teaser>
}

export type FullCommentRatingSystem = {
  __typename?: 'FullCommentRatingSystem'
  answers: Array<CommentRatingSystemAnswer>
  id: Scalars['ID']
  name?: Maybe<Scalars['String']>
}

export type FullPoll = {
  __typename?: 'FullPoll'
  answers?: Maybe<Array<PollAnswerWithVoteCount>>
  closedAt?: Maybe<Scalars['DateTime']>
  externalVoteSources?: Maybe<Array<PollExternalVoteSource>>
  id: Scalars['ID']
  infoText?: Maybe<Scalars['RichText']>
  opensAt: Scalars['DateTime']
  question?: Maybe<Scalars['String']>
}

export type GalleryImageEdge = {
  __typename?: 'GalleryImageEdge'
  caption?: Maybe<Scalars['String']>
  image?: Maybe<Image>
}

export type HtmlBlock = {
  __typename?: 'HTMLBlock'
  html?: Maybe<Scalars['String']>
}

export type Image = {
  __typename?: 'Image'
  createdAt: Scalars['DateTime']
  description?: Maybe<Scalars['String']>
  extension: Scalars['String']
  fileSize: Scalars['Int']
  filename?: Maybe<Scalars['String']>
  focalPoint?: Maybe<Point>
  format: Scalars['String']
  height: Scalars['Int']
  id: Scalars['ID']
  license?: Maybe<Scalars['String']>
  link?: Maybe<Scalars['String']>
  mimeType: Scalars['String']
  modifiedAt: Scalars['DateTime']
  source?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  title?: Maybe<Scalars['String']>
  transformURL?: Maybe<Scalars['String']>
  url?: Maybe<Scalars['String']>
  width: Scalars['Int']
}

export type ImageTransformUrlArgs = {
  input?: InputMaybe<ImageTransformation>
}

export type ImageBlock = {
  __typename?: 'ImageBlock'
  caption?: Maybe<Scalars['String']>
  image?: Maybe<Image>
}

export type ImageGalleryBlock = {
  __typename?: 'ImageGalleryBlock'
  images: Array<GalleryImageEdge>
}

export enum ImageOutput {
  Jpeg = 'JPEG',
  Png = 'PNG',
  Webp = 'WEBP'
}

export enum ImageRotation {
  Auto = 'AUTO',
  Rotate_0 = 'ROTATE_0',
  Rotate_90 = 'ROTATE_90',
  Rotate_180 = 'ROTATE_180',
  Rotate_270 = 'ROTATE_270'
}

export type ImageTransformation = {
  height?: InputMaybe<Scalars['Int']>
  output?: InputMaybe<ImageOutput>
  quality?: InputMaybe<Scalars['Float']>
  rotation?: InputMaybe<ImageRotation>
  width?: InputMaybe<Scalars['Int']>
}

export type InputPoint = {
  x: Scalars['Float']
  y: Scalars['Float']
}

export type InstagramPostBlock = {
  __typename?: 'InstagramPostBlock'
  postID: Scalars['String']
}

export type Invoice = {
  __typename?: 'Invoice'
  canceledAt?: Maybe<Scalars['DateTime']>
  createdAt: Scalars['DateTime']
  description?: Maybe<Scalars['String']>
  id: Scalars['ID']
  items: Array<InvoiceItem>
  mail: Scalars['String']
  modifiedAt: Scalars['DateTime']
  paidAt?: Maybe<Scalars['DateTime']>
  subscriptionID: Scalars['ID']
  total: Scalars['Int']
}

export type InvoiceItem = {
  __typename?: 'InvoiceItem'
  amount: Scalars['Int']
  createdAt: Scalars['DateTime']
  description?: Maybe<Scalars['String']>
  modifiedAt: Scalars['DateTime']
  name: Scalars['String']
  quantity: Scalars['Int']
  total: Scalars['Int']
}

export type LinkPageBreakBlock = {
  __typename?: 'LinkPageBreakBlock'
  hideButton: Scalars['Boolean']
  image?: Maybe<Image>
  layoutOption?: Maybe<Scalars['String']>
  linkTarget?: Maybe<Scalars['String']>
  linkText?: Maybe<Scalars['String']>
  linkURL?: Maybe<Scalars['String']>
  richText: Scalars['RichText']
  styleOption?: Maybe<Scalars['String']>
  templateOption?: Maybe<Scalars['String']>
  text?: Maybe<Scalars['String']>
}

export type ListicleBlock = {
  __typename?: 'ListicleBlock'
  items: Array<ListicleItem>
}

export type ListicleItem = {
  __typename?: 'ListicleItem'
  image?: Maybe<Image>
  richText: Scalars['RichText']
  title: Scalars['String']
}

export type MemberPlan = {
  __typename?: 'MemberPlan'
  amountPerMonthMin: Scalars['Int']
  availablePaymentMethods: Array<AvailablePaymentMethod>
  description?: Maybe<Scalars['RichText']>
  id: Scalars['ID']
  image?: Maybe<Image>
  name: Scalars['String']
  slug: Scalars['String']
  tags?: Maybe<Array<Scalars['String']>>
}

export type MemberPlanConnection = {
  __typename?: 'MemberPlanConnection'
  nodes: Array<MemberPlan>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type MemberPlanFilter = {
  active?: InputMaybe<Scalars['Boolean']>
  name?: InputMaybe<Scalars['String']>
  tags?: InputMaybe<Array<Scalars['String']>>
}

export enum MemberPlanSort {
  CreatedAt = 'CREATED_AT',
  ModifiedAt = 'MODIFIED_AT'
}

export type Mutation = {
  __typename?: 'Mutation'
  /** This mutation allows to add a comment. The input is of type CommentInput. */
  addComment: Comment
  /** This mutation allows to cancel the users subscriptions. The deactivation date will be either paidUntil or now */
  cancelUserSubscription?: Maybe<Subscription>
  /** This mutation allows to create payment by taking an input of type PaymentFromInvoiceInput. */
  createPaymentFromInvoice?: Maybe<Payment>
  createSession: SessionWithToken
  createSessionWithJWT: SessionWithToken
  createSessionWithOAuth2Code: SessionWithToken
  /** Allows authenticated users to create additional subscriptions */
  createSubscription: Payment
  /** This mutation extends an subscription early */
  extendSubscription: Payment
  /** This mutation allows to rate a comment. Supports logged in and anonymous */
  rateComment: CommentRating
  /** This mutation allows to register a new member, */
  registerMember: Registration
  /** This mutation allows to register a new member, select a member plan, payment method and create an invoice.  */
  registerMemberAndReceivePayment: RegistrationAndPayment
  /** This mutation revokes and deletes the active session. */
  revokeActiveSession: Scalars['Boolean']
  /** This mutation sends a login link to the email if the user exists. Method will always return email address */
  sendWebsiteLogin: Scalars['String']
  /** This mutation allows to update a comment. The input is of type CommentUpdateInput which contains the ID of the comment you want to update and the new text. */
  updateComment: Comment
  /** This mutation allows to update the user's password by entering the new password. The repeated new password gives an error if the passwords don't match or if the user is not authenticated. */
  updatePassword?: Maybe<User>
  /** This mutation allows to update the Payment Provider Customers */
  updatePaymentProviderCustomers: Array<PaymentProviderCustomer>
  /** This mutation allows to update the user's data by taking an input of type UserInput. */
  updateUser?: Maybe<User>
  /** This mutation allows to update the user's subscription by taking an input of type UserSubscription and throws an error if the user doesn't already have a subscription. Updating user subscriptions will set deactivation to null */
  updateUserSubscription?: Maybe<Subscription>
  /** This mutation allows to upload and update the user's profile image. */
  uploadUserProfileImage?: Maybe<User>
  /** This mutation allows to vote on a poll (or update one's decision). Supports logged in and anonymous */
  voteOnPoll?: Maybe<PollVote>
}

export type MutationAddCommentArgs = {
  input: CommentInput
}

export type MutationCancelUserSubscriptionArgs = {
  id: Scalars['ID']
}

export type MutationCreatePaymentFromInvoiceArgs = {
  input: PaymentFromInvoiceInput
}

export type MutationCreateSessionArgs = {
  email: Scalars['String']
  password: Scalars['String']
}

export type MutationCreateSessionWithJwtArgs = {
  jwt: Scalars['String']
}

export type MutationCreateSessionWithOAuth2CodeArgs = {
  code: Scalars['String']
  name: Scalars['String']
  redirectUri: Scalars['String']
}

export type MutationCreateSubscriptionArgs = {
  autoRenew: Scalars['Boolean']
  failureURL?: InputMaybe<Scalars['String']>
  memberPlanID?: InputMaybe<Scalars['ID']>
  memberPlanSlug?: InputMaybe<Scalars['Slug']>
  monthlyAmount: Scalars['Int']
  paymentMethodID?: InputMaybe<Scalars['ID']>
  paymentMethodSlug?: InputMaybe<Scalars['Slug']>
  paymentPeriodicity: PaymentPeriodicity
  subscriptionProperties?: InputMaybe<Array<PublicPropertiesInput>>
  successURL?: InputMaybe<Scalars['String']>
}

export type MutationExtendSubscriptionArgs = {
  failureURL?: InputMaybe<Scalars['String']>
  subscriptionId: Scalars['String']
  successURL?: InputMaybe<Scalars['String']>
}

export type MutationRateCommentArgs = {
  answerId: Scalars['ID']
  commentId: Scalars['ID']
  value: Scalars['Int']
}

export type MutationRegisterMemberArgs = {
  address?: InputMaybe<UserAddressInput>
  challengeAnswer: ChallengeInput
  email: Scalars['String']
  firstName?: InputMaybe<Scalars['String']>
  name: Scalars['String']
  password?: InputMaybe<Scalars['String']>
  preferredName?: InputMaybe<Scalars['String']>
}

export type MutationRegisterMemberAndReceivePaymentArgs = {
  address?: InputMaybe<UserAddressInput>
  autoRenew: Scalars['Boolean']
  challengeAnswer: ChallengeInput
  email: Scalars['String']
  failureURL?: InputMaybe<Scalars['String']>
  firstName?: InputMaybe<Scalars['String']>
  memberPlanID?: InputMaybe<Scalars['ID']>
  memberPlanSlug?: InputMaybe<Scalars['Slug']>
  monthlyAmount: Scalars['Int']
  name: Scalars['String']
  password?: InputMaybe<Scalars['String']>
  paymentMethodID?: InputMaybe<Scalars['ID']>
  paymentMethodSlug?: InputMaybe<Scalars['Slug']>
  paymentPeriodicity: PaymentPeriodicity
  preferredName?: InputMaybe<Scalars['String']>
  subscriptionProperties?: InputMaybe<Array<PublicPropertiesInput>>
  successURL?: InputMaybe<Scalars['String']>
}

export type MutationSendWebsiteLoginArgs = {
  email: Scalars['String']
}

export type MutationUpdateCommentArgs = {
  input: CommentUpdateInput
}

export type MutationUpdatePasswordArgs = {
  password: Scalars['String']
  passwordRepeated: Scalars['String']
}

export type MutationUpdatePaymentProviderCustomersArgs = {
  input: Array<PaymentProviderCustomerInput>
}

export type MutationUpdateUserArgs = {
  input: UserInput
}

export type MutationUpdateUserSubscriptionArgs = {
  id: Scalars['ID']
  input: SubscriptionInput
}

export type MutationUploadUserProfileImageArgs = {
  uploadImageInput?: InputMaybe<UploadImageInput>
}

export type MutationVoteOnPollArgs = {
  answerId: Scalars['ID']
}

export type Navigation = {
  __typename?: 'Navigation'
  id: Scalars['ID']
  key: Scalars['String']
  links: Array<NavigationLink>
  name: Scalars['String']
}

export type NavigationLink = ArticleNavigationLink | ExternalNavigationLink | PageNavigationLink

export type OAuth2Account = {
  __typename?: 'OAuth2Account'
  provider: Scalars['String']
  scope: Scalars['String']
  type: Scalars['String']
}

export type Page = {
  __typename?: 'Page'
  blocks: Array<Block>
  description?: Maybe<Scalars['String']>
  id: Scalars['ID']
  image?: Maybe<Image>
  properties: Array<PublicProperties>
  publishedAt: Scalars['DateTime']
  slug: Scalars['Slug']
  socialMediaDescription?: Maybe<Scalars['String']>
  socialMediaImage?: Maybe<Image>
  socialMediaTitle?: Maybe<Scalars['String']>
  tags: Array<Scalars['String']>
  title: Scalars['String']
  updatedAt: Scalars['DateTime']
  url: Scalars['String']
}

export type PageConnection = {
  __typename?: 'PageConnection'
  nodes: Array<Page>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type PageInfo = {
  __typename?: 'PageInfo'
  endCursor?: Maybe<Scalars['String']>
  hasNextPage: Scalars['Boolean']
  hasPreviousPage: Scalars['Boolean']
  startCursor?: Maybe<Scalars['String']>
}

export type PageNavigationLink = BaseNavigationLink & {
  __typename?: 'PageNavigationLink'
  label: Scalars['String']
  page?: Maybe<Page>
}

export type PageTeaser = {
  __typename?: 'PageTeaser'
  image?: Maybe<Image>
  lead?: Maybe<Scalars['String']>
  page?: Maybe<Page>
  preTitle?: Maybe<Scalars['String']>
  style: TeaserStyle
  title?: Maybe<Scalars['String']>
}

export type Payment = {
  __typename?: 'Payment'
  id: Scalars['ID']
  intentSecret?: Maybe<Scalars['String']>
  paymentMethod: PaymentMethod
  state: PaymentState
}

export type PaymentFromInvoiceInput = {
  failureURL?: InputMaybe<Scalars['String']>
  invoiceID: Scalars['String']
  paymentMethodID?: InputMaybe<Scalars['ID']>
  paymentMethodSlug?: InputMaybe<Scalars['Slug']>
  successURL?: InputMaybe<Scalars['String']>
}

export type PaymentMethod = {
  __typename?: 'PaymentMethod'
  description: Scalars['String']
  id: Scalars['ID']
  name: Scalars['String']
  paymentProviderID: Scalars['String']
  slug: Scalars['Slug']
}

export enum PaymentPeriodicity {
  Biannual = 'BIANNUAL',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Yearly = 'YEARLY'
}

export type PaymentProviderCustomer = {
  __typename?: 'PaymentProviderCustomer'
  customerID: Scalars['String']
  paymentProviderID: Scalars['String']
}

export type PaymentProviderCustomerInput = {
  customerID: Scalars['String']
  paymentProviderID: Scalars['String']
}

export enum PaymentState {
  Canceled = 'Canceled',
  Created = 'Created',
  Declined = 'Declined',
  Paid = 'Paid',
  Processing = 'Processing',
  RequiresUserAction = 'RequiresUserAction',
  Submitted = 'Submitted'
}

export type Peer = {
  __typename?: 'Peer'
  createdAt: Scalars['DateTime']
  hostURL: Scalars['String']
  id: Scalars['ID']
  isDisabled?: Maybe<Scalars['Boolean']>
  modifiedAt: Scalars['DateTime']
  name: Scalars['String']
  profile?: Maybe<PeerProfile>
  slug: Scalars['String']
}

export type PeerArticleTeaser = {
  __typename?: 'PeerArticleTeaser'
  article?: Maybe<Article>
  articleID: Scalars['ID']
  image?: Maybe<Image>
  lead?: Maybe<Scalars['String']>
  peer?: Maybe<Peer>
  preTitle?: Maybe<Scalars['String']>
  style: TeaserStyle
  title?: Maybe<Scalars['String']>
}

export type PeerProfile = {
  __typename?: 'PeerProfile'
  callToActionImage?: Maybe<Image>
  callToActionImageURL?: Maybe<Scalars['String']>
  callToActionText: Scalars['RichText']
  callToActionURL: Scalars['String']
  hostURL: Scalars['String']
  logo?: Maybe<Image>
  name: Scalars['String']
  themeColor: Scalars['Color']
  themeFontColor: Scalars['Color']
  websiteURL: Scalars['String']
}

export type Phrase = {
  __typename?: 'Phrase'
  articles: Array<Article>
  pages: Array<Page>
}

export type Point = {
  __typename?: 'Point'
  x: Scalars['Float']
  y: Scalars['Float']
}

export type PolisConversationBlock = {
  __typename?: 'PolisConversationBlock'
  conversationID: Scalars['String']
}

export type PollAnswerWithVoteCount = {
  __typename?: 'PollAnswerWithVoteCount'
  answer?: Maybe<Scalars['String']>
  id: Scalars['ID']
  pollId: Scalars['ID']
  votes: Scalars['Int']
}

export type PollBlock = {
  __typename?: 'PollBlock'
  poll?: Maybe<FullPoll>
}

export type PollExternalVote = {
  __typename?: 'PollExternalVote'
  amount?: Maybe<Scalars['VoteValue']>
  answerId: Scalars['ID']
  id: Scalars['ID']
}

export type PollExternalVoteSource = {
  __typename?: 'PollExternalVoteSource'
  id: Scalars['ID']
  source?: Maybe<Scalars['String']>
  voteAmounts?: Maybe<Array<PollExternalVote>>
}

export type PollVote = {
  __typename?: 'PollVote'
  createdAt: Scalars['DateTime']
  disabled?: Maybe<Scalars['Boolean']>
  fingerprint?: Maybe<Scalars['String']>
}

export type PublicProperties = {
  __typename?: 'PublicProperties'
  key: Scalars['String']
  value: Scalars['String']
}

export type PublicPropertiesInput = {
  key: Scalars['String']
  value: Scalars['String']
}

export type PublishedPageFilter = {
  tags?: InputMaybe<Array<Scalars['String']>>
}

export enum PublishedPageSort {
  PublishedAt = 'PUBLISHED_AT',
  UpdatedAt = 'UPDATED_AT'
}

export type Query = {
  __typename?: 'Query'
  /** This query takes either the ID, slug or token and returns the article. */
  article?: Maybe<Article>
  /** This query returns the articles. */
  articles: ArticleConnection
  /** This query returns the redirect Uri. */
  authProviders: Array<AuthProvider>
  /** This query takes either the ID or the slug and returns the author. */
  author?: Maybe<Author>
  /** This query is to get the authors. */
  authors: AuthorConnection
  /** This query generates a challenge which can be used to access protected endpoints. */
  challenge: Challenge
  /** This mutation will check the invoice status and update with information from the paymentProvider */
  checkInvoiceStatus?: Maybe<Invoice>
  /** This query returns the comments of an item. */
  comments: Array<Comment>
  /** This query returns an event */
  event: Event
  /** This query returns a list of events */
  events?: Maybe<EventConnection>
  /** This query returns the invoices  of the authenticated user. */
  invoices: Array<Invoice>
  /** This query returns the user. */
  me?: Maybe<User>
  /** This query returns a member plan. */
  memberPlan?: Maybe<MemberPlan>
  /** This query returns the member plans. */
  memberPlans: MemberPlanConnection
  /** This query takes either the ID or the key and returns the navigation. */
  navigation?: Maybe<Navigation>
  /** This query returns all navigations. */
  navigations?: Maybe<Array<Navigation>>
  /** This query takes either the ID, slug or token and returns the page. */
  page?: Maybe<Page>
  /** This query returns the pages. */
  pages: PageConnection
  /** This query takes either the ID or the slug and returns the peer profile. */
  peer?: Maybe<Peer>
  /** This query takes either the peer ID or the peer slug and returns the article. */
  peerArticle?: Maybe<Article>
  /** This query returns the peer profile. */
  peerProfile: PeerProfile
  /** This query performs a fulltext search on titles and blocks of articles/pages and returns all matching ones. */
  phrase?: Maybe<Phrase>
  /** This query returns a poll with all the needed data */
  poll: FullPoll
  ratingSystem: FullCommentRatingSystem
  /** This query returns the subscriptions of the authenticated user. */
  subscriptions: Array<Subscription>
  /** This query returns a list of tags */
  tags?: Maybe<TagConnection>
  /** This query returns the value of a comments answer rating if the user has already rated it. */
  userCommentRatings: Array<Maybe<CommentRating>>
  /** This query returns the answerId of a poll if the user has already voted on it. */
  userPollVote?: Maybe<Scalars['ID']>
}

export type QueryArticleArgs = {
  id?: InputMaybe<Scalars['ID']>
  slug?: InputMaybe<Scalars['Slug']>
  token?: InputMaybe<Scalars['String']>
}

export type QueryArticlesArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<ArticleFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<ArticleSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryAuthProvidersArgs = {
  redirectUri?: InputMaybe<Scalars['String']>
}

export type QueryAuthorArgs = {
  id?: InputMaybe<Scalars['ID']>
  slug?: InputMaybe<Scalars['Slug']>
}

export type QueryAuthorsArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<AuthorFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<AuthorSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryCheckInvoiceStatusArgs = {
  id: Scalars['ID']
}

export type QueryCommentsArgs = {
  itemId: Scalars['ID']
  order?: InputMaybe<SortOrder>
  sort?: InputMaybe<CommentSort>
}

export type QueryEventArgs = {
  id: Scalars['ID']
}

export type QueryEventsArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<EventFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<EventSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryMemberPlanArgs = {
  id?: InputMaybe<Scalars['ID']>
  slug?: InputMaybe<Scalars['Slug']>
}

export type QueryMemberPlansArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<MemberPlanFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<MemberPlanSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryNavigationArgs = {
  id?: InputMaybe<Scalars['ID']>
  key?: InputMaybe<Scalars['ID']>
}

export type QueryPageArgs = {
  id?: InputMaybe<Scalars['ID']>
  slug?: InputMaybe<Scalars['Slug']>
  token?: InputMaybe<Scalars['String']>
}

export type QueryPagesArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<PublishedPageFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<PublishedPageSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryPeerArgs = {
  id?: InputMaybe<Scalars['ID']>
  slug?: InputMaybe<Scalars['Slug']>
}

export type QueryPeerArticleArgs = {
  id: Scalars['ID']
  peerID?: InputMaybe<Scalars['ID']>
  peerSlug?: InputMaybe<Scalars['Slug']>
}

export type QueryPhraseArgs = {
  query: Scalars['String']
}

export type QueryPollArgs = {
  id: Scalars['ID']
}

export type QueryTagsArgs = {
  cursor?: InputMaybe<Scalars['ID']>
  filter?: InputMaybe<TagFilter>
  order?: InputMaybe<SortOrder>
  skip?: InputMaybe<Scalars['Int']>
  sort?: InputMaybe<TagSort>
  take?: InputMaybe<Scalars['Int']>
}

export type QueryUserCommentRatingsArgs = {
  commentId: Scalars['ID']
}

export type QueryUserPollVoteArgs = {
  pollId: Scalars['ID']
}

export type QuoteBlock = {
  __typename?: 'QuoteBlock'
  author?: Maybe<Scalars['String']>
  quote?: Maybe<Scalars['String']>
}

export enum RatingSystemType {
  Star = 'STAR'
}

export type Registration = {
  __typename?: 'Registration'
  session: UserSession
  user: User
}

export type RegistrationAndPayment = {
  __typename?: 'RegistrationAndPayment'
  payment: Payment
  session: UserSession
  user: User
}

export type RichTextBlock = {
  __typename?: 'RichTextBlock'
  richText: Scalars['RichText']
}

export type SessionWithToken = {
  __typename?: 'SessionWithToken'
  createdAt: Scalars['DateTime']
  expiresAt: Scalars['DateTime']
  token: Scalars['String']
  user: User
}

export enum SortOrder {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING'
}

export type SoundCloudTrackBlock = {
  __typename?: 'SoundCloudTrackBlock'
  trackID: Scalars['String']
}

export type Subscription = {
  __typename?: 'Subscription'
  autoRenew: Scalars['Boolean']
  deactivation?: Maybe<SubscriptionDeactivation>
  id: Scalars['ID']
  memberPlan: MemberPlan
  monthlyAmount: Scalars['Int']
  paidUntil?: Maybe<Scalars['DateTime']>
  paymentMethod: PaymentMethod
  paymentPeriodicity: PaymentPeriodicity
  properties: Array<PublicProperties>
  startsAt: Scalars['DateTime']
}

export type SubscriptionDeactivation = {
  __typename?: 'SubscriptionDeactivation'
  date: Scalars['DateTime']
  reason: SubscriptionDeactivationReason
}

export enum SubscriptionDeactivationReason {
  InvoiceNotPaid = 'INVOICE_NOT_PAID',
  None = 'NONE',
  UserSelfDeactivated = 'USER_SELF_DEACTIVATED'
}

export type SubscriptionInput = {
  autoRenew: Scalars['Boolean']
  id: Scalars['ID']
  memberPlanID: Scalars['String']
  monthlyAmount: Scalars['Int']
  paymentMethodID: Scalars['String']
  paymentPeriodicity: PaymentPeriodicity
}

export type Tag = {
  __typename?: 'Tag'
  id: Scalars['ID']
  tag?: Maybe<Scalars['String']>
  type?: Maybe<TagType>
}

export type TagConnection = {
  __typename?: 'TagConnection'
  nodes: Array<Tag>
  pageInfo: PageInfo
  totalCount: Scalars['Int']
}

export type TagFilter = {
  tag?: InputMaybe<Scalars['String']>
  type?: InputMaybe<TagType>
}

export enum TagSort {
  CreatedAt = 'CREATED_AT',
  ModifiedAt = 'MODIFIED_AT',
  Tag = 'TAG'
}

export enum TagType {
  Comment = 'Comment',
  Event = 'Event'
}

export type Teaser = ArticleTeaser | CustomTeaser | PageTeaser | PeerArticleTeaser

export type TeaserGridBlock = {
  __typename?: 'TeaserGridBlock'
  numColumns: Scalars['Int']
  teasers: Array<Maybe<Teaser>>
}

export type TeaserGridFlexBlock = {
  __typename?: 'TeaserGridFlexBlock'
  flexTeasers: Array<FlexTeaser>
}

export enum TeaserStyle {
  Default = 'DEFAULT',
  Light = 'LIGHT',
  Text = 'TEXT'
}

export type TikTokVideoBlock = {
  __typename?: 'TikTokVideoBlock'
  userID: Scalars['String']
  videoID: Scalars['String']
}

export type TitleBlock = {
  __typename?: 'TitleBlock'
  lead?: Maybe<Scalars['String']>
  title?: Maybe<Scalars['String']>
}

export type TwitterTweetBlock = {
  __typename?: 'TwitterTweetBlock'
  tweetID: Scalars['String']
  userID: Scalars['String']
}

export type UploadImageInput = {
  description?: InputMaybe<Scalars['String']>
  file: Scalars['Upload']
  filename?: InputMaybe<Scalars['String']>
  focalPoint?: InputMaybe<InputPoint>
  license?: InputMaybe<Scalars['String']>
  link?: InputMaybe<Scalars['String']>
  source?: InputMaybe<Scalars['String']>
  tags?: InputMaybe<Array<Scalars['String']>>
  title?: InputMaybe<Scalars['String']>
}

export type User = {
  __typename?: 'User'
  address?: Maybe<UserAddress>
  email: Scalars['String']
  firstName?: Maybe<Scalars['String']>
  id: Scalars['String']
  image?: Maybe<Image>
  name: Scalars['String']
  oauth2Accounts: Array<OAuth2Account>
  paymentProviderCustomers: Array<PaymentProviderCustomer>
  preferredName?: Maybe<Scalars['String']>
}

export type UserAddress = {
  __typename?: 'UserAddress'
  city?: Maybe<Scalars['String']>
  company?: Maybe<Scalars['String']>
  country?: Maybe<Scalars['String']>
  streetAddress?: Maybe<Scalars['String']>
  streetAddress2?: Maybe<Scalars['String']>
  zipCode?: Maybe<Scalars['String']>
}

export type UserAddressInput = {
  city?: InputMaybe<Scalars['String']>
  company?: InputMaybe<Scalars['String']>
  country?: InputMaybe<Scalars['String']>
  streetAddress?: InputMaybe<Scalars['String']>
  streetAddress2?: InputMaybe<Scalars['String']>
  zipCode?: InputMaybe<Scalars['String']>
}

export type UserInput = {
  address?: InputMaybe<UserAddressInput>
  email: Scalars['String']
  firstName?: InputMaybe<Scalars['String']>
  name: Scalars['String']
  preferredName?: InputMaybe<Scalars['String']>
  uploadImageInput?: InputMaybe<UploadImageInput>
}

export type UserSession = {
  __typename?: 'UserSession'
  createdAt: Scalars['DateTime']
  expiresAt: Scalars['DateTime']
  token: Scalars['String']
}

export type VimeoVideoBlock = {
  __typename?: 'VimeoVideoBlock'
  videoID: Scalars['String']
}

export type YouTubeVideoBlock = {
  __typename?: 'YouTubeVideoBlock'
  videoID: Scalars['String']
}

export type OverriddenRating = {
  __typename?: 'overriddenRating'
  answerId: Scalars['ID']
  value?: Maybe<Scalars['Int']>
}

export type NavigationListQueryVariables = Exact<{[key: string]: never}>

export type NavigationListQuery = {
  __typename?: 'Query'
  navigations?: Array<{
    __typename?: 'Navigation'
    id: string
    key: string
    name: string
    links: Array<
      | {
          __typename?: 'ArticleNavigationLink'
          label: string
          article?: {__typename?: 'Article'; url: string} | null
        }
      | {__typename?: 'ExternalNavigationLink'; label: string; url: string}
      | {
          __typename?: 'PageNavigationLink'
          label: string
          page?: {__typename?: 'Page'; url: string} | null
        }
    >
  }> | null
}

export const NavigationListDocument = gql`
  query NavigationList {
    navigations {
      id
      key
      name
      links {
        ... on PageNavigationLink {
          label
          page {
            url
          }
        }
        ... on ArticleNavigationLink {
          label
          article {
            url
          }
        }
        ... on ExternalNavigationLink {
          label
          url
        }
      }
    }
  }
`

/**
 * __useNavigationListQuery__
 *
 * To run a query within a React component, call `useNavigationListQuery` and pass it any options that fit your needs.
 * When your component renders, `useNavigationListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNavigationListQuery({
 *   variables: {
 *   },
 * });
 */
export function useNavigationListQuery(
  baseOptions?: Apollo.QueryHookOptions<NavigationListQuery, NavigationListQueryVariables>
) {
  const options = {...defaultOptions, ...baseOptions}
  return Apollo.useQuery<NavigationListQuery, NavigationListQueryVariables>(
    NavigationListDocument,
    options
  )
}
export function useNavigationListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<NavigationListQuery, NavigationListQueryVariables>
) {
  const options = {...defaultOptions, ...baseOptions}
  return Apollo.useLazyQuery<NavigationListQuery, NavigationListQueryVariables>(
    NavigationListDocument,
    options
  )
}
export type NavigationListQueryHookResult = ReturnType<typeof useNavigationListQuery>
export type NavigationListLazyQueryHookResult = ReturnType<typeof useNavigationListLazyQuery>
export type NavigationListQueryResult = Apollo.QueryResult<
  NavigationListQuery,
  NavigationListQueryVariables
>
