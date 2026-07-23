import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  MailLogState,
  MailLogType,
  MailSendAudience,
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
}

/** Which subscriptions to include when narrowing a subscription-based audience. */
export enum MailSubscriptionState {
  active = 'active',
  pending = 'pending',
  deactivated = 'deactivated',
}

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

@InputType()
export class MailAudienceInput {
  @Field(() => MailRecipientBase)
  base!: MailRecipientBase;

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
}

@InputType()
export class MailSendJobInput {
  @Field()
  mailTemplateId!: string;

  @Field(() => MailAudienceInput)
  audience!: MailAudienceInput;
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

  @Field(() => String, { nullable: true })
  subject?: string | null;

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

  @Field(() => Int)
  totalCount!: number;

  @Field(() => Int)
  sentCount!: number;

  @Field(() => Int)
  failedCount!: number;

  @Field(() => Date, { nullable: true })
  startedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date | null;

  @Field(() => String, { nullable: true })
  error?: string | null;

  @Field(() => MailLogTemplate, { nullable: true })
  mailTemplate?: MailLogTemplate | null;
}

@ObjectType()
export class PaginatedMailSendJob extends PaginatedType(MailSendJobModel) {}

@ObjectType()
export class MailSendRecipientPreview {
  @Field(() => Int, { description: 'Number of mails that would be sent.' })
  count!: number;

  @Field({
    description:
      'Whether recipients carry subscription data (subscription-context templates allowed).',
  })
  allowsSubscriptionTemplates!: boolean;
}
