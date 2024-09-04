// THIS FILE IS AUTOGENERATED
import {Node} from 'slate'
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: string;
  /** Setting Value */
  GraphQLSettingValueType: any;
  RichText: Node[];
};

export type AllowedSettingVals = {
  __typename?: 'AllowedSettingVals';
  boolChoice?: Maybe<Scalars['Boolean']>;
  stringChoice?: Maybe<Array<Scalars['String']>>;
};

export type BlockStyle = {
  __typename?: 'BlockStyle';
  blocks: Array<BlockType>;
  createdAt: Scalars['DateTime'];
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
};

export enum BlockType {
  Comment = 'Comment',
  Embed = 'Embed',
  Event = 'Event',
  Html = 'HTML',
  Image = 'Image',
  ImageGallery = 'ImageGallery',
  LinkPageBreak = 'LinkPageBreak',
  Listicle = 'Listicle',
  Poll = 'Poll',
  Quote = 'Quote',
  RichText = 'RichText',
  TeaserGrid1 = 'TeaserGrid1',
  TeaserGrid6 = 'TeaserGrid6',
  TeaserGridFlex = 'TeaserGridFlex',
  TeaserList = 'TeaserList',
  Title = 'Title'
}

export type Consent = {
  __typename?: 'Consent';
  createdAt: Scalars['DateTime'];
  defaultValue: Scalars['Boolean'];
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

export type ConsentFilter = {
  defaultValue?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};

export type DashboardInvoice = {
  __typename?: 'DashboardInvoice';
  amount: Scalars['Int'];
  dueAt: Scalars['DateTime'];
  memberPlan?: Maybe<Scalars['String']>;
  paidAt?: Maybe<Scalars['DateTime']>;
};

export type DashboardSubscription = {
  __typename?: 'DashboardSubscription';
  deactivationDate?: Maybe<Scalars['DateTime']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  memberPlan: Scalars['String'];
  monthlyAmount: Scalars['Int'];
  paymentPeriodicity: PaymentPeriodicity;
  reasonForDeactivation?: Maybe<SubscriptionDeactivationReason>;
  renewsAt?: Maybe<Scalars['DateTime']>;
  startsAt: Scalars['DateTime'];
};

export type Event = {
  __typename?: 'Event';
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['RichText']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  externalSourceId?: Maybe<Scalars['String']>;
  externalSourceName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  image?: Maybe<Image>;
  imageId?: Maybe<Scalars['String']>;
  lead?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  startsAt: Scalars['DateTime'];
  status: EventStatus;
};

export type EventFilter = {
  from?: InputMaybe<Scalars['DateTime']>;
  location?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<Scalars['String']>>;
  to?: InputMaybe<Scalars['DateTime']>;
  upcomingOnly?: InputMaybe<Scalars['Boolean']>;
};

export type EventFromSource = {
  __typename?: 'EventFromSource';
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['RichText']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  externalSourceId?: Maybe<Scalars['String']>;
  externalSourceName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  lead?: Maybe<Scalars['String']>;
  location?: Maybe<Scalars['String']>;
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  startsAt: Scalars['DateTime'];
  status: EventStatus;
};

export enum EventSort {
  CreatedAt = 'CreatedAt',
  EndsAt = 'EndsAt',
  ModifiedAt = 'ModifiedAt',
  StartsAt = 'StartsAt'
}

export enum EventStatus {
  Cancelled = 'Cancelled',
  Postponed = 'Postponed',
  Rescheduled = 'Rescheduled',
  Scheduled = 'Scheduled'
}

export type FocalPoint = {
  __typename?: 'FocalPoint';
  x: Scalars['Float'];
  y: Scalars['Float'];
};

export type Image = {
  __typename?: 'Image';
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['RichText']>;
  extension: Scalars['String'];
  fileSize: Scalars['Int'];
  filename?: Maybe<Scalars['String']>;
  focalPoint?: Maybe<FocalPoint>;
  format: Scalars['String'];
  height: Scalars['Int'];
  id: Scalars['String'];
  license?: Maybe<Scalars['String']>;
  link?: Maybe<Scalars['String']>;
  mimeType: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  source?: Maybe<Scalars['String']>;
  tags: Array<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  width: Scalars['Int'];
};

export type ImportedEventFilter = {
  from?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  providers?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  to?: InputMaybe<Scalars['String']>;
};

export enum ImportedEventSort {
  CreatedAt = 'CREATED_AT',
  EndsAt = 'ENDS_AT',
  ModifiedAt = 'MODIFIED_AT',
  StartsAt = 'STARTS_AT'
}

export type ImportedEventsDocument = {
  __typename?: 'ImportedEventsDocument';
  nodes: Array<EventFromSource>;
  pageInfo: PageInfo;
  totalCount: Scalars['Float'];
};

export type MailProviderModel = {
  __typename?: 'MailProviderModel';
  name: Scalars['String'];
};

export type MailTemplateRef = {
  __typename?: 'MailTemplateRef';
  id: Scalars['String'];
  name: Scalars['String'];
};

export type MailTemplateWithUrlAndStatusModel = {
  __typename?: 'MailTemplateWithUrlAndStatusModel';
  description?: Maybe<Scalars['String']>;
  externalMailTemplateId: Scalars['String'];
  id: Scalars['String'];
  name: Scalars['String'];
  remoteMissing: Scalars['Boolean'];
  status: Scalars['String'];
  url: Scalars['String'];
};

export type MemberPlanRef = {
  __typename?: 'MemberPlanRef';
  id: Scalars['String'];
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Creates a new block style. */
  createBlockStyle: BlockStyle;
  /**
   *
   *       Create a new consent.
   *
   */
  createConsent: Consent;
  /** Creates a new event. */
  createEvent: Event;
  /** Create a new subscription flow */
  createSubscriptionFlow: Array<SubscriptionFlowModel>;
  /** Create a subscription interval */
  createSubscriptionInterval: Array<SubscriptionFlowModel>;
  /**
   *
   *       Creates a new userConsent based on input.
   *       Returns created userConsent.
   *
   */
  createUserConsent: UserConsent;
  /** Deletes an existing block style. */
  deleteBlockStyle: BlockStyle;
  /**
   *
   *       Deletes an existing consent.
   *
   */
  deleteConsent: Consent;
  /** Deletes an existing event. */
  deleteEvent: Event;
  /** Delete poll vote */
  deletePollVote: Array<PollVote>;
  /** Delete an existing subscription flow */
  deleteSubscriptionFlow: Array<SubscriptionFlowModel>;
  /** Delete an existing subscription interval */
  deleteSubscriptionInterval: Array<SubscriptionFlowModel>;
  /**
   *
   *       Delete an existing userConsent by id.
   *       Returns deleted userConsent.
   *
   */
  deleteUserConsent: UserConsent;
  /**
   *
   *       Creates and event based on data from importable events list and an id and provider.
   *       Also, uploads an image to WePublish Image library.
   *
   */
  importEvent: Scalars['String'];
  syncTemplates?: Maybe<Scalars['Boolean']>;
  /** Sends a test email for the given event */
  testSystemMail: Scalars['Boolean'];
  /** Updates an existing block style. */
  updateBlockStyle: BlockStyle;
  /**
   *
   *       Updates an existing consent.
   *
   */
  updateConsent: Consent;
  /** Updates an existing event. */
  updateEvent: Event;
  /** Updates an existing setting. */
  updateSetting: Setting;
  /** Update an existing subscription flow */
  updateSubscriptionFlow: Array<SubscriptionFlowModel>;
  /** Update an existing subscription interval */
  updateSubscriptionInterval: Array<SubscriptionFlowModel>;
  /** Updates an existing mail flow */
  updateSystemMail: Array<SystemMailModel>;
  /**
   *
   *       Updates an existing userConsent based on input.
   *       Returns updated userConsent.
   *
   */
  updateUserConsent: UserConsent;
};


export type MutationCreateBlockStyleArgs = {
  blocks: Array<BlockType>;
  name: Scalars['String'];
};


export type MutationCreateConsentArgs = {
  defaultValue: Scalars['Boolean'];
  name: Scalars['String'];
  slug: Scalars['String'];
};


export type MutationCreateEventArgs = {
  description?: InputMaybe<Scalars['RichText']>;
  endsAt?: InputMaybe<Scalars['DateTime']>;
  imageId?: InputMaybe<Scalars['String']>;
  lead?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  startsAt: Scalars['DateTime'];
  tagIds?: InputMaybe<Array<Scalars['String']>>;
};


export type MutationCreateSubscriptionFlowArgs = {
  autoRenewal: Array<Scalars['Boolean']>;
  memberPlanId: Scalars['String'];
  paymentMethodIds: Array<Scalars['String']>;
  periodicities: Array<PaymentPeriodicity>;
};


export type MutationCreateSubscriptionIntervalArgs = {
  daysAwayFromEnding?: InputMaybe<Scalars['Int']>;
  event: SubscriptionEvent;
  mailTemplateId?: InputMaybe<Scalars['String']>;
  subscriptionFlowId: Scalars['String'];
};


export type MutationCreateUserConsentArgs = {
  consentId: Scalars['String'];
  userId: Scalars['String'];
  value: Scalars['Boolean'];
};


export type MutationDeleteBlockStyleArgs = {
  id: Scalars['String'];
};


export type MutationDeleteConsentArgs = {
  id: Scalars['String'];
};


export type MutationDeleteEventArgs = {
  id: Scalars['String'];
};


export type MutationDeletePollVoteArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteSubscriptionFlowArgs = {
  id: Scalars['String'];
};


export type MutationDeleteSubscriptionIntervalArgs = {
  id: Scalars['String'];
};


export type MutationDeleteUserConsentArgs = {
  id: Scalars['String'];
};


export type MutationImportEventArgs = {
  id: Scalars['String'];
  source: Scalars['String'];
};


export type MutationTestSystemMailArgs = {
  event: UserEvent;
};


export type MutationUpdateBlockStyleArgs = {
  blocks?: InputMaybe<Array<BlockType>>;
  id: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateConsentArgs = {
  defaultValue?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateEventArgs = {
  description?: InputMaybe<Scalars['RichText']>;
  endsAt?: InputMaybe<Scalars['DateTime']>;
  id: Scalars['String'];
  imageId?: InputMaybe<Scalars['String']>;
  lead?: InputMaybe<Scalars['String']>;
  location?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  startsAt?: InputMaybe<Scalars['DateTime']>;
  tagIds?: InputMaybe<Array<Scalars['String']>>;
};


export type MutationUpdateSettingArgs = {
  name: SettingName;
  value: Scalars['GraphQLSettingValueType'];
};


export type MutationUpdateSubscriptionFlowArgs = {
  autoRenewal?: InputMaybe<Array<Scalars['Boolean']>>;
  id: Scalars['String'];
  paymentMethodIds?: InputMaybe<Array<Scalars['String']>>;
  periodicities?: InputMaybe<Array<PaymentPeriodicity>>;
};


export type MutationUpdateSubscriptionIntervalArgs = {
  daysAwayFromEnding?: InputMaybe<Scalars['Int']>;
  id: Scalars['String'];
  mailTemplateId?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateSystemMailArgs = {
  event: UserEvent;
  mailTemplateId: Scalars['String'];
};


export type MutationUpdateUserConsentArgs = {
  id: Scalars['String'];
  value: Scalars['Boolean'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
};

export type PaginatedEvents = {
  __typename?: 'PaginatedEvents';
  nodes: Array<Event>;
  pageInfo: PageInfo;
  totalCount: Scalars['Float'];
};

export type PaginatedPollVotes = {
  __typename?: 'PaginatedPollVotes';
  nodes: Array<PollVote>;
  pageInfo: PageInfo;
  totalCount: Scalars['Float'];
};

export type PaymentMethodRef = {
  __typename?: 'PaymentMethodRef';
  id: Scalars['String'];
  name: Scalars['String'];
};

export enum PaymentPeriodicity {
  Biannual = 'biannual',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  Yearly = 'yearly'
}

export type PeriodicJob = {
  __typename?: 'PeriodicJob';
  createdAt: Scalars['DateTime'];
  date: Scalars['DateTime'];
  error?: Maybe<Scalars['String']>;
  executionTime?: Maybe<Scalars['DateTime']>;
  finishedWithError?: Maybe<Scalars['DateTime']>;
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  successfullyFinished?: Maybe<Scalars['DateTime']>;
  tries: Scalars['Float'];
};

export type PollAnswerInVote = {
  __typename?: 'PollAnswerInVote';
  answer: Scalars['String'];
  id: Scalars['ID'];
};

export type PollVote = {
  __typename?: 'PollVote';
  answer: PollAnswerInVote;
  answerId: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  disabled: Scalars['String'];
  fingerprint?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  pollId: Scalars['ID'];
  userId?: Maybe<Scalars['ID']>;
};

export type PollVoteFilter = {
  answerIds?: InputMaybe<Array<Scalars['String']>>;
  fingerprint?: InputMaybe<Scalars['String']>;
  from?: InputMaybe<Scalars['DateTime']>;
  pollId?: InputMaybe<Scalars['String']>;
  to?: InputMaybe<Scalars['DateTime']>;
  userId?: InputMaybe<Scalars['String']>;
};

export enum PollVoteSort {
  CreatedAt = 'CreatedAt'
}

export type Query = {
  __typename?: 'Query';
  /**
   *
   *       Returns all active subscribers.
   *       Includes subscribers with a cancelled but not run out subscription.
   *
   */
  activeSubscribers: Array<DashboardSubscription>;
  /** Returns a list of block styles. */
  blockStyles: Array<BlockStyle>;
  /**
   *
   *       Returns a consent by id.
   *
   */
  consent: Consent;
  /**
   *
   *       Returns all consents.
   *
   */
  consents: Array<Consent>;
  /** Returns a event by id. */
  event: Event;
  /**
   *
   *       Returns a list of Importable Event Providers
   *
   */
  eventProviders: Array<Scalars['String']>;
  /** Returns a paginated list of events based on the filters given. */
  events: PaginatedEvents;
  /**
   *
   *       Returns the expected revenue for the time period given.
   *       Excludes cancelled or manually set as paid invoices.
   *
   */
  expectedRevenue: Array<DashboardInvoice>;
  /** Returns an image by id. */
  image: Image;
  /**
   *
   *       Returns a more detailed version of a single importable event, by id and source.
   *
   */
  importedEvent: EventFromSource;
  /**
   *
   *       Returns a list of imported events from external sources, transformed to match our model.
   *
   */
  importedEvents: ImportedEventsDocument;
  /**
   *
   *       Returns a list of external source ids of already imported events.
   *
   */
  importedEventsIds: Array<Scalars['String']>;
  /** Return all mail templates */
  mailTemplates: Array<MailTemplateWithUrlAndStatusModel>;
  /**
   *
   *       Returns all new deactivations in a given timeframe.
   *       This considers the time the deactivation was made, not when the subscription runs out.
   *
   */
  newDeactivations: Array<DashboardSubscription>;
  /**
   *
   *       Returns all new subscribers in a given timeframe.
   *       Includes already deactivated ones.
   *
   */
  newSubscribers: Array<DashboardSubscription>;
  /** Returns all payment methods */
  paymentMethods: Array<PaymentMethodRef>;
  periodicJobLog: Array<PeriodicJob>;
  /** Returns a paginated list of poll votes */
  pollVotes: PaginatedPollVotes;
  provider: MailProviderModel;
  /**
   *
   *       Returns all renewing subscribers in a given timeframe.
   *
   */
  renewingSubscribers: Array<DashboardSubscription>;
  /**
   *
   *       Returns the revenue generated for the time period given.
   *       Only includes paid invoices that have not been manually paid.
   *
   */
  revenue: Array<DashboardInvoice>;
  /**
   *
   *       Returns a single setting by id.
   *
   */
  setting: Setting;
  /**
   *
   *       Returns all settings.
   *
   */
  settingsList: Array<Setting>;
  stats?: Maybe<Stats>;
  /** Returns all subscription flows */
  subscriptionFlows: Array<SubscriptionFlowModel>;
  /** Returns all mail flows */
  systemMails: Array<SystemMailModel>;
  /**
   *
   *       Returns a single userConsent by id.
   *
   */
  userConsent: UserConsent;
  /**
   *
   *       Returns a list of userConsents. Possible to filter.
   *
   */
  userConsents: Array<UserConsent>;
  versionInformation: VersionInformation;
};


export type QueryConsentArgs = {
  id: Scalars['String'];
};


export type QueryConsentsArgs = {
  filter?: InputMaybe<ConsentFilter>;
};


export type QueryEventArgs = {
  id: Scalars['String'];
};


export type QueryEventsArgs = {
  cursorId?: InputMaybe<Scalars['String']>;
  filter?: InputMaybe<EventFilter>;
  order?: InputMaybe<SortOrder>;
  skip?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<EventSort>;
  take?: InputMaybe<Scalars['Int']>;
};


export type QueryExpectedRevenueArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryImageArgs = {
  id: Scalars['String'];
};


export type QueryImportedEventArgs = {
  filter: SingleEventFilter;
};


export type QueryImportedEventsArgs = {
  filter?: InputMaybe<ImportedEventFilter>;
  order?: InputMaybe<Scalars['Int']>;
  skip?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<ImportedEventSort>;
  take?: InputMaybe<Scalars['Int']>;
};


export type QueryNewDeactivationsArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryNewSubscribersArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryPeriodicJobLogArgs = {
  skip?: InputMaybe<Scalars['Int']>;
  take?: InputMaybe<Scalars['Int']>;
};


export type QueryPollVotesArgs = {
  cursorId?: InputMaybe<Scalars['ID']>;
  filter?: InputMaybe<PollVoteFilter>;
  order?: InputMaybe<SortOrder>;
  skip?: InputMaybe<Scalars['Int']>;
  sort?: InputMaybe<PollVoteSort>;
  take?: InputMaybe<Scalars['Int']>;
};


export type QueryRenewingSubscribersArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QueryRevenueArgs = {
  end?: InputMaybe<Scalars['DateTime']>;
  start: Scalars['DateTime'];
};


export type QuerySettingArgs = {
  id: Scalars['String'];
};


export type QuerySettingsListArgs = {
  filter?: InputMaybe<SettingFilter>;
};


export type QuerySubscriptionFlowsArgs = {
  defaultFlowOnly: Scalars['Boolean'];
  memberPlanId?: InputMaybe<Scalars['String']>;
};


export type QueryUserConsentArgs = {
  id: Scalars['String'];
};


export type QueryUserConsentsArgs = {
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  value?: InputMaybe<Scalars['Boolean']>;
};

export type Setting = {
  __typename?: 'Setting';
  id: Scalars['ID'];
  name: SettingName;
  settingRestriction?: Maybe<SettingRestriction>;
  value?: Maybe<Scalars['GraphQLSettingValueType']>;
};

export type SettingFilter = {
  name?: InputMaybe<Scalars['String']>;
};

export enum SettingName {
  AllowCommentEditing = 'ALLOW_COMMENT_EDITING',
  AllowGuestCommenting = 'ALLOW_GUEST_COMMENTING',
  AllowGuestCommentRating = 'ALLOW_GUEST_COMMENT_RATING',
  AllowGuestPollVoting = 'ALLOW_GUEST_POLL_VOTING',
  BodyScript = 'BODY_SCRIPT',
  CommentCharLimit = 'COMMENT_CHAR_LIMIT',
  HeadScript = 'HEAD_SCRIPT',
  MailProviderName = 'MAIL_PROVIDER_NAME',
  MakeActiveSubscribersApiPublic = 'MAKE_ACTIVE_SUBSCRIBERS_API_PUBLIC',
  MakeExpectedRevenueApiPublic = 'MAKE_EXPECTED_REVENUE_API_PUBLIC',
  MakeNewDeactivationsApiPublic = 'MAKE_NEW_DEACTIVATIONS_API_PUBLIC',
  MakeNewSubscribersApiPublic = 'MAKE_NEW_SUBSCRIBERS_API_PUBLIC',
  MakeRenewingSubscribersApiPublic = 'MAKE_RENEWING_SUBSCRIBERS_API_PUBLIC',
  MakeRevenueApiPublic = 'MAKE_REVENUE_API_PUBLIC',
  PeeringTimeoutMs = 'PEERING_TIMEOUT_MS',
  ResetPasswordJwtExpiresMin = 'RESET_PASSWORD_JWT_EXPIRES_MIN',
  SendLoginJwtExpiresMin = 'SEND_LOGIN_JWT_EXPIRES_MIN'
}

export type SettingRestriction = {
  __typename?: 'SettingRestriction';
  allowedValues?: Maybe<AllowedSettingVals>;
  inputLength?: Maybe<Scalars['Int']>;
  maxValue?: Maybe<Scalars['Int']>;
  minValue?: Maybe<Scalars['Int']>;
};

export type SingleEventFilter = {
  id: Scalars['String'];
  source: Scalars['String'];
};

export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending'
}

export type Stats = {
  __typename?: 'Stats';
  articlesCount: Scalars['Int'];
  authorsCount: Scalars['Int'];
  firstArticleDate?: Maybe<Scalars['DateTime']>;
};

export enum SubscriptionDeactivationReason {
  InvoiceNotPaid = 'invoiceNotPaid',
  None = 'none',
  UserSelfDeactivated = 'userSelfDeactivated'
}

export enum SubscriptionEvent {
  Custom = 'CUSTOM',
  DeactivationByUser = 'DEACTIVATION_BY_USER',
  DeactivationUnpaid = 'DEACTIVATION_UNPAID',
  InvoiceCreation = 'INVOICE_CREATION',
  RenewalFailed = 'RENEWAL_FAILED',
  RenewalSuccess = 'RENEWAL_SUCCESS',
  Subscribe = 'SUBSCRIBE'
}

export type SubscriptionFlowModel = {
  __typename?: 'SubscriptionFlowModel';
  autoRenewal: Array<Scalars['Boolean']>;
  default: Scalars['Boolean'];
  id: Scalars['String'];
  intervals: Array<SubscriptionInterval>;
  memberPlan?: Maybe<MemberPlanRef>;
  numberOfSubscriptions: Scalars['Int'];
  paymentMethods: Array<PaymentMethodRef>;
  periodicities: Array<PaymentPeriodicity>;
};

export type SubscriptionInterval = {
  __typename?: 'SubscriptionInterval';
  daysAwayFromEnding?: Maybe<Scalars['Int']>;
  event: SubscriptionEvent;
  id: Scalars['String'];
  mailTemplate?: Maybe<MailTemplateRef>;
};

export type SystemMailModel = {
  __typename?: 'SystemMailModel';
  event: UserEvent;
  mailTemplate?: Maybe<MailTemplateRef>;
};

export type User = {
  __typename?: 'User';
  active: Scalars['Boolean'];
  createdAt: Scalars['DateTime'];
  email: Scalars['String'];
  emailVerifiedAt?: Maybe<Scalars['DateTime']>;
  firstName?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  lastLogin?: Maybe<Scalars['DateTime']>;
  modifiedAt: Scalars['DateTime'];
  name: Scalars['String'];
  password: Scalars['String'];
  preferredName?: Maybe<Scalars['String']>;
  roleIDs: Array<Scalars['String']>;
  userImageID?: Maybe<Scalars['String']>;
};

export type UserConsent = {
  __typename?: 'UserConsent';
  consent: Consent;
  createdAt: Scalars['DateTime'];
  id: Scalars['String'];
  modifiedAt: Scalars['DateTime'];
  user: User;
  value: Scalars['Boolean'];
};

export enum UserEvent {
  AccountCreation = 'ACCOUNT_CREATION',
  LoginLink = 'LOGIN_LINK',
  PasswordReset = 'PASSWORD_RESET',
  TestMail = 'TEST_MAIL'
}

export type VersionInformation = {
  __typename?: 'VersionInformation';
  version: Scalars['String'];
};

export type RevenueQueryVariables = Exact<{
  start: Scalars['DateTime'];
  end?: InputMaybe<Scalars['DateTime']>;
}>;


export type RevenueQuery = { __typename?: 'Query', revenue: Array<{ __typename?: 'DashboardInvoice', amount: number, paidAt?: string | null, memberPlan?: string | null }> };

export type StatsQueryVariables = Exact<{ [key: string]: never; }>;


export type StatsQuery = { __typename?: 'Query', stats?: { __typename?: 'Stats', articlesCount: number, authorsCount: number, firstArticleDate?: string | null } | null };

export type VersionInformationQueryVariables = Exact<{ [key: string]: never; }>;


export type VersionInformationQuery = { __typename?: 'Query', versionInformation: { __typename?: 'VersionInformation', version: string } };


export const RevenueDocument = gql`
    query Revenue($start: DateTime!, $end: DateTime) {
  revenue(start: $start, end: $end) {
    amount
    paidAt
    memberPlan
  }
}
    `;

/**
 * __useRevenueQuery__
 *
 * To run a query within a React component, call `useRevenueQuery` and pass it any options that fit your needs.
 * When your component renders, `useRevenueQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRevenueQuery({
 *   variables: {
 *      start: // value for 'start'
 *      end: // value for 'end'
 *   },
 * });
 */
export function useRevenueQuery(baseOptions: Apollo.QueryHookOptions<RevenueQuery, RevenueQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RevenueQuery, RevenueQueryVariables>(RevenueDocument, options);
      }
export function useRevenueLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RevenueQuery, RevenueQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RevenueQuery, RevenueQueryVariables>(RevenueDocument, options);
        }
export type RevenueQueryHookResult = ReturnType<typeof useRevenueQuery>;
export type RevenueLazyQueryHookResult = ReturnType<typeof useRevenueLazyQuery>;
export type RevenueQueryResult = Apollo.QueryResult<RevenueQuery, RevenueQueryVariables>;
export const StatsDocument = gql`
    query Stats {
  stats {
    articlesCount
    authorsCount
    firstArticleDate
  }
}
    `;

/**
 * __useStatsQuery__
 *
 * To run a query within a React component, call `useStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStatsQuery({
 *   variables: {
 *   },
 * });
 */
export function useStatsQuery(baseOptions?: Apollo.QueryHookOptions<StatsQuery, StatsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<StatsQuery, StatsQueryVariables>(StatsDocument, options);
      }
export function useStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<StatsQuery, StatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<StatsQuery, StatsQueryVariables>(StatsDocument, options);
        }
export type StatsQueryHookResult = ReturnType<typeof useStatsQuery>;
export type StatsLazyQueryHookResult = ReturnType<typeof useStatsLazyQuery>;
export type StatsQueryResult = Apollo.QueryResult<StatsQuery, StatsQueryVariables>;
export const VersionInformationDocument = gql`
    query VersionInformation {
  versionInformation {
    version
  }
}
    `;

/**
 * __useVersionInformationQuery__
 *
 * To run a query within a React component, call `useVersionInformationQuery` and pass it any options that fit your needs.
 * When your component renders, `useVersionInformationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVersionInformationQuery({
 *   variables: {
 *   },
 * });
 */
export function useVersionInformationQuery(baseOptions?: Apollo.QueryHookOptions<VersionInformationQuery, VersionInformationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<VersionInformationQuery, VersionInformationQueryVariables>(VersionInformationDocument, options);
      }
export function useVersionInformationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<VersionInformationQuery, VersionInformationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<VersionInformationQuery, VersionInformationQueryVariables>(VersionInformationDocument, options);
        }
export type VersionInformationQueryHookResult = ReturnType<typeof useVersionInformationQuery>;
export type VersionInformationLazyQueryHookResult = ReturnType<typeof useVersionInformationLazyQuery>;
export type VersionInformationQueryResult = Apollo.QueryResult<VersionInformationQuery, VersionInformationQueryVariables>;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
