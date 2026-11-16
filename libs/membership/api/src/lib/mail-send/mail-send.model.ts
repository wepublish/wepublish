import {
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  EmailQualityEventSource,
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  MailChannel,
  MailLogState,
  MailLogType,
  MailProviderType,
  MailSendAudience,
  MailSendJobRecipientState,
  MailSendJobState,
  PaymentPeriodicity,
} from '@prisma/client';
import { PaginatedType } from '@wepublish/utils/api';

/**
 * The base set of users an audience is drawn from. `hasSubscription` is the only
 * base that produces a subscription per recipient (and therefore allows
 * subscription-context templates); the others produce plain users.
 */
export enum MailRecipientBase {
  allUsers = 'allUsers',
  hasSubscription = 'hasSubscription',
  noActiveSubscription = 'noActiveSubscription',
  /** Win-back: subscriptions that ended recently, owner not subscribed again. */
  endedSubscription = 'endedSubscription',
}

/** Default look-back window for the win-back audience. */
export const DEFAULT_ENDED_WITHIN_DAYS = 90;

/** Which subscriptions to include when narrowing a subscription-based audience. */
export enum MailSubscriptionState {
  active = 'active',
  pending = 'pending',
  deactivated = 'deactivated',
}

export enum MailEmailFilter {
  all = 'all',
  placeholder = 'placeholder',
  real = 'real',
}

registerEnumType(MailEmailFilter, {
  name: 'MailEmailFilter',
});

/**
 * Who can still be reached by email. `placeholder` is recognised by the
 * address pattern of the letter integration; the others are the stored
 * email quality level (see EmailQualityLevel), `unknown` including people
 * never evaluated. Picking several means any of them.
 */
export enum MailEmailSegment {
  placeholder = 'placeholder',
  dead = 'dead',
  unresponsive = 'unresponsive',
  unknown = 'unknown',
  active = 'active',
}

registerEnumType(MailEmailSegment, {
  name: 'MailEmailSegment',
  description:
    'placeholder: generated address, reachable by letter only. dead: bounced, invalid, complained or unsubscribed. unresponsive: mails delivered, no login or click for a long time. unknown: nothing decided yet. active: logged in or clicked recently.',
});

registerEnumType(MailRecipientBase, {
  name: 'MailRecipientBase',
  description: 'Base set of users a manual-send audience is drawn from.',
});

registerEnumType(MailSubscriptionState, {
  name: 'MailSubscriptionState',
});

registerEnumType(MailLogState, {
  name: 'MailLogState',
});

registerEnumType(MailLogType, {
  name: 'MailLogType',
  description: 'Origin of a sent mail.',
});

registerEnumType(MailSendJobState, {
  name: 'MailSendJobState',
});

registerEnumType(MailSendAudience, {
  name: 'MailSendAudience',
});

registerEnumType(MailSendJobRecipientState, {
  name: 'MailSendJobRecipientState',
  description: 'Where one planned mail of a send job stands.',
});

registerEnumType(MailChannel, {
  name: 'MailChannel',
  description: 'Whether a send goes out as an email or as a printed letter.',
});

registerEnumType(LetterAddressPosition, {
  name: 'LetterAddressPosition',
  description: 'Where the address window sits on the printed sheet.',
});

registerEnumType(LetterDeliveryProduct, {
  name: 'LetterDeliveryProduct',
});

registerEnumType(LetterPrintMode, {
  name: 'LetterPrintMode',
});

registerEnumType(LetterPrintSpectrum, {
  name: 'LetterPrintSpectrum',
});

/**
 * How a letter is printed and posted. Every field has a default, so a mail send
 * never has to supply them.
 */
@InputType()
export class LetterPrintInput {
  @Field(() => LetterAddressPosition, { nullable: true })
  addressPosition?: LetterAddressPosition;

  @Field(() => LetterDeliveryProduct, { nullable: true })
  deliveryProduct?: LetterDeliveryProduct;

  @Field(() => LetterPrintMode, { nullable: true })
  printMode?: LetterPrintMode;

  @Field(() => LetterPrintSpectrum, { nullable: true })
  printSpectrum?: LetterPrintSpectrum;
}

/** How several mail-history conditions combine. */
export enum MailHistoryMatch {
  all = 'all',
  any = 'any',
}

registerEnumType(MailHistoryMatch, {
  name: 'MailHistoryMatch',
  description:
    'all: every condition must hold (AND). any: one condition suffices (OR).',
});

@InputType()
export class MailHistoryCondition {
  @Field({ description: 'The mail template that was, or was not, sent.' })
  mailTemplateId!: string;

  @Field({
    nullable: true,
    description:
      'true: keeps people who did NOT receive such a mail, including people with no mail at all.',
  })
  negate?: boolean;

  @Field(() => [MailLogState], {
    nullable: true,
    description:
      'Only mails that ended in one of these states. Empty or absent means any.',
  })
  states?: MailLogState[];

  @Field(() => MailChannel, {
    nullable: true,
    description: 'Only mails sent on this channel. Absent means either.',
  })
  channel?: MailChannel;

  @Field(() => Date, { nullable: true, description: 'Sent on or after.' })
  from?: Date;

  @Field(() => Date, { nullable: true, description: 'Sent on or before.' })
  to?: Date;
}

@InputType()
export class MailHistoryFilterInput {
  @Field(() => MailHistoryMatch, {
    nullable: true,
    description: 'Defaults to all.',
  })
  match?: MailHistoryMatch;

  @Field(() => [MailHistoryCondition])
  conditions!: MailHistoryCondition[];
}

@InputType()
export class MailAudienceInput {
  @Field(() => MailRecipientBase)
  base!: MailRecipientBase;

  @Field(() => MailHistoryFilterInput, {
    nullable: true,
    description:
      'Applies to every base: which mails the person did or did not receive. An empty list means no restriction.',
  })
  mailHistory?: MailHistoryFilterInput;

  @Field(() => MailEmailFilter, {
    nullable: true,
    description:
      'Restrict to placeholder or real email addresses. Defaults to all.',
  })
  emailFilter?: MailEmailFilter;

  @Field(() => [MailEmailSegment], {
    nullable: true,
    description:
      'Restrict to people in any of these email segments. Empty or absent means everyone.',
  })
  emailSegments?: MailEmailSegment[];

  @Field(() => [String], {
    nullable: true,
    description: 'Restrict to subscriptions of these member plans.',
  })
  memberPlanIDs?: string[];

  @Field(() => MailSubscriptionState, { nullable: true })
  subscriptionState?: MailSubscriptionState;

  @Field({ nullable: true })
  autoRenew?: boolean;

  @Field({ nullable: true })
  paymentMethodID?: string;

  @Field(() => PaymentPeriodicity, { nullable: true })
  paymentPeriodicity?: PaymentPeriodicity;

  @Field(() => Date, {
    nullable: true,
    description:
      'Subscribers audience only: only subscriptions that started on or after this date.',
  })
  startsAtFrom?: Date;

  @Field(() => Date, {
    nullable: true,
    description:
      'Subscribers audience only: only subscriptions that started on or before this date.',
  })
  startsAtTo?: Date;

  @Field(() => Date, {
    nullable: true,
    description:
      'Subscribers audience only: only subscriptions whose effective end (cancellation date, else paidUntil) is on or after this date.',
  })
  endsAtFrom?: Date;

  @Field(() => Date, {
    nullable: true,
    description:
      'Subscribers audience only: only subscriptions whose effective end (cancellation date, else paidUntil) is on or before this date.',
  })
  endsAtTo?: Date;

  @Field({
    nullable: true,
    description:
      'Subscribers audience only: true keeps only subscriptions that are currently paid up (started and paidUntil in the future); false keeps the rest. Grace periods are not considered.',
  })
  isPaid?: boolean;

  @Field({
    nullable: true,
    description:
      'Subscribers audience only: true keeps only subscriptions that have given notice, including cancellations that only take effect in the future; false keeps the rest.',
  })
  isCanceled?: boolean;

  @Field({
    nullable: true,
    description:
      'Subscribers audience only: true keeps only subscriptions that replaced another one (typically an upgrade, but downgrades and lateral plan switches are included too, and manual or imported changes are not detected).',
  })
  hasReplacedSubscription?: boolean;

  @Field(() => Int, {
    nullable: true,
    description:
      'Win-back audience only: how far back an ended subscription may lie, in days. Ignored when an explicit period is given.',
  })
  endedWithinDays?: number;

  @Field(() => Date, {
    nullable: true,
    description:
      'Win-back audience only: start of an explicit period the subscription ended in.',
  })
  endedFrom?: Date;

  @Field(() => Date, {
    nullable: true,
    description:
      'Win-back audience only: end of an explicit period the subscription ended in.',
  })
  endedTo?: Date;
}

@InputType()
export class MailSendJobInput {
  @Field()
  mailTemplateId!: string;

  @Field(() => MailAudienceInput)
  audience!: MailAudienceInput;

  @Field(() => MailChannel, {
    nullable: true,
    description: 'Defaults to mail.',
  })
  channel?: MailChannel;

  @Field(() => LetterPrintInput, {
    nullable: true,
    description: 'Letter sends only. Ignored for mail.',
  })
  print?: LetterPrintInput;
}

@InputType()
export class MailLogFilter {
  @Field({ nullable: true })
  mailTemplateId?: string;

  @Field({ nullable: true })
  recipientId?: string;

  @Field(() => MailLogState, { nullable: true })
  state?: MailLogState;

  @Field(() => MailLogType, { nullable: true })
  type?: MailLogType;

  @Field(() => MailChannel, { nullable: true })
  channel?: MailChannel;

  @Field({ nullable: true })
  mailSendJobId?: string;
}

@ObjectType()
export class MailLogRecipient {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;
}

@ObjectType()
export class MailLogTemplate {
  @Field()
  id!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class MailLogModel {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  sentDate!: Date;

  @Field(() => MailLogState)
  state!: MailLogState;

  @Field(() => MailLogType, { nullable: true })
  type?: MailLogType | null;

  @Field(() => MailChannel)
  channel!: MailChannel;

  @Field(() => String, {
    nullable: true,
    description: 'Letters only: id the print vendor assigned to the letter.',
  })
  providerLetterID?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Letters only: the address the letter was sent to.',
  })
  address?: string | null;

  @Field(() => String, { nullable: true })
  subject?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Why a rejected mail could not be delivered.',
  })
  error?: string | null;

  @Field()
  mailProviderID!: string;

  @Field(() => String, { nullable: true })
  mailSendJobId?: string | null;

  @Field(() => MailLogRecipient)
  recipient!: MailLogRecipient;

  @Field(() => MailLogTemplate)
  mailTemplate!: MailLogTemplate;
}

@ObjectType()
export class PaginatedMailLog extends PaginatedType(MailLogModel) {}

@ObjectType()
export class MailLogSyncModel {
  @Field(() => Int, {
    description:
      'Mails that were still in an open state and could be looked up at the provider.',
  })
  checked!: number;

  @Field(() => Int, {
    description: 'Mails whose state the provider reported differently.',
  })
  updated!: number;
}

@ObjectType()
export class EmailQualityRefreshModel extends MailLogSyncModel {
  @Field(() => Int, {
    description: 'People whose email level was re-evaluated.',
  })
  recomputed!: number;
}

registerEnumType(EmailQualityEventSource, {
  name: 'EmailQualityEventSource',
  description:
    'send: the provider refused the address when a mail was sent. webhook: the provider reported it. poll: asked of the provider or read from a newsletter audience. verification: an address verification service.',
});

@ObjectType()
export class EmailEvidenceSourceModel {
  @Field(() => EmailQualityEventSource)
  source!: EmailQualityEventSource;

  @Field(() => Int, {
    description: 'Events of this source in the last 30 days.',
  })
  count!: number;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'When the newest event of this source arrived, ever.',
  })
  lastAt!: Date | null;
}

@ObjectType({
  description:
    'Where the email status comes from: whether the mail provider reports anything, when it last did, and how much evidence arrived lately.',
})
export class EmailEvidenceModel {
  @Field(() => MailProviderType, { nullable: true })
  providerType!: MailProviderType | null;

  @Field(() => String, { nullable: true })
  providerName!: string | null;

  @Field({
    description:
      'Whether the configured provider reports delivery outcomes at all. SMTP never does.',
  })
  providerReportsDelivery!: boolean;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description:
      'When the provider last called the webhook with a verified request.',
  })
  lastWebhookAt!: Date | null;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description: 'When the provider was last asked for delivery states.',
  })
  lastPollAt!: Date | null;

  @Field(() => String, {
    nullable: true,
    description: 'What went wrong on the last poll; null when it succeeded.',
  })
  lastPollError!: string | null;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description:
      'Newest evidence from any provider source. Null means the status rests on logins and confirmations alone.',
  })
  lastProviderEvidenceAt!: Date | null;

  @Field(() => Int, {
    description:
      'Days without provider evidence after which the editor warns (setting emailQualityEvidenceWarnAfterDays).',
  })
  warnAfterDays!: number;

  @Field(() => [EmailEvidenceSourceModel])
  sources!: EmailEvidenceSourceModel[];
}

@ObjectType()
export class MailSegmentCount {
  @Field(() => MailEmailSegment)
  segment!: MailEmailSegment;

  @Field(() => Int)
  userCount!: number;
}

@ObjectType()
export class MailSendJobOutcome {
  @Field(() => Int, {
    description: 'Mails the provider reported as delivered.',
  })
  delivered!: number;

  @Field(() => Int, {
    description: 'Mails that bounced or were rejected by the provider.',
  })
  bounced!: number;

  @Field(() => Int, {
    description:
      'Recipients whose address counts as dead by now, from this or a later mail.',
  })
  dead!: number;

  @Field(() => Int, { description: 'Mails somebody clicked a link in.' })
  clicked!: number;
}

@ObjectType()
export class MailSendJobModel {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  mailTemplateId!: string;

  @Field()
  createdByUserId!: string;

  @Field(() => MailSendJobState)
  status!: MailSendJobState;

  @Field(() => MailSendAudience)
  audience!: MailSendAudience;

  @Field(() => MailChannel)
  channel!: MailChannel;

  @Field(() => Int)
  totalCount!: number;

  @Field(() => Int)
  sentCount!: number;

  @Field(() => Int)
  failedCount!: number;

  @Field(() => Int, {
    description:
      'Mails handed to the provider whose outcome never came back — left over after an interruption. Never re-sent on their own.',
  })
  sendingCount!: number;

  @Field(() => Date, { nullable: true })
  startedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date | null;

  @Field(() => Date, {
    nullable: true,
    description: 'Last sign of life of the worker processing this job.',
  })
  heartbeatAt?: Date | null;

  @Field(() => Int, {
    description: 'How often the job was picked up again after an interruption.',
  })
  resumeCount!: number;

  @Field(() => String, { nullable: true })
  error?: string | null;

  @Field(() => MailLogTemplate, { nullable: true })
  mailTemplate?: MailLogTemplate | null;

  @Field(() => MailSendJobOutcome, {
    description:
      'What became of the mails after sending. Bounces arrive over hours or days; refresh to pull late ones.',
  })
  outcome?: MailSendJobOutcome;
}

@ObjectType()
export class PaginatedMailSendJob extends PaginatedType(MailSendJobModel) {}

@ObjectType()
export class MailSendJobRecipientModel {
  @Field()
  id!: string;

  @Field(() => Int, { description: 'Position in the send queue.' })
  position!: number;

  @Field(() => MailSendJobRecipientState)
  state!: MailSendJobRecipientState;

  @Field(() => Int)
  attempts!: number;

  @Field(() => String, { nullable: true })
  error?: string | null;

  @Field(() => Date, { nullable: true })
  sentAt?: Date | null;

  @Field(() => String, { nullable: true })
  mailLogId?: string | null;

  @Field(() => MailLogRecipient)
  user!: MailLogRecipient;

  @Field(() => String, { nullable: true })
  memberPlanName?: string | null;
}

@ObjectType()
export class PaginatedMailSendJobRecipient extends PaginatedType(
  MailSendJobRecipientModel
) {}

@ObjectType()
export class MailSendRecipientModel {
  @Field({
    description:
      'Row identity. A user appears once per matching subscription, so this combines both.',
  })
  id!: string;

  @Field()
  userId!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  subscriptionId?: string | null;

  @Field(() => String, { nullable: true })
  memberPlanName?: string | null;

  @Field({
    description:
      'Whether the user has a postal address a letter can be sent to. A letter send skips recipients without one.',
  })
  hasAddress!: boolean;

  @Field(() => MailEmailSegment, {
    description: 'Which email segment the recipient falls into.',
  })
  emailSegment!: MailEmailSegment;
}

@ObjectType()
export class PaginatedMailSendRecipient extends PaginatedType(
  MailSendRecipientModel
) {}

@InputType()
export class MailSendPreviewInput {
  @Field()
  mailTemplateId!: string;

  @Field(() => MailAudienceInput)
  audience!: MailAudienceInput;

  @Field(() => MailChannel, {
    nullable: true,
    description: 'Defaults to mail. A letter preview renders the pdf.',
  })
  channel?: MailChannel;

  @Field(() => LetterPrintInput, { nullable: true })
  print?: LetterPrintInput;

  @Field(() => String, {
    nullable: true,
    description:
      'Row id of the recipient to render for. Defaults to the first of the audience.',
  })
  recipientId?: string;
}

@ObjectType()
export class MailSendPreviewModel {
  @Field()
  subject!: string;

  @Field({ description: 'Empty for a letter preview.' })
  html!: string;

  @Field(() => String, { nullable: true })
  text?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Letter previews only: the rendered pdf, base64 encoded, exactly as it would be printed.',
  })
  pdf?: string | null;

  @Field(() => MailSendRecipientModel, {
    nullable: true,
    description: 'The recipient this preview was rendered for.',
  })
  recipient?: MailSendRecipientModel | null;
}

@ObjectType()
export class MailSendRecipientPreview {
  @Field(() => Int, {
    description:
      'Number of messages that would be sent over the given channel. A letter send reaches every person once, so it equals `userCount`.',
  })
  count!: number;

  @Field(() => Int, {
    description:
      'Number of distinct people reached. Lower than `count` when someone has several matching subscriptions.',
  })
  userCount!: number;

  @Field({
    description:
      'Whether recipients carry subscription data (subscription-context templates allowed).',
  })
  allowsSubscriptionTemplates!: boolean;

  @Field(() => Int, {
    description:
      'How many of the recipients have no usable postal address and would be skipped by a letter send.',
  })
  withoutAddressCount!: number;

  @Field(() => [MailSegmentCount], {
    description:
      'How the people of this audience split into email segments, ignoring the segments picked, so the split stays visible while choosing.',
  })
  segments!: MailSegmentCount[];
}
