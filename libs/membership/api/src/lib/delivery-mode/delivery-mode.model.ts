import {
  Field,
  GraphQLISODateTime,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  DeliveryPreferenceOrigin,
  DeliverySuggestionKind,
  EmailQualityLevel,
  MailChannel,
} from '@prisma/client';
import { MailLogRecipient } from '../mail-send/mail-send.model';

registerEnumType(DeliveryPreferenceOrigin, {
  name: 'DeliveryPreferenceOrigin',
  description:
    'manual: set by an admin, final until an admin changes it. suggestion: set by confirming a suggestion, may be suggested back.',
});

registerEnumType(DeliverySuggestionKind, {
  name: 'DeliverySuggestionKind',
  description: 'toLetter: move to printed letters. toMail: move back to mail.',
});

@ObjectType()
export class UserDeliveryPreferenceModel {
  @Field(() => MailChannel, {
    description: 'How automated subscription mails reach this user.',
  })
  channel!: MailChannel;

  @Field(() => DeliveryPreferenceOrigin, { nullable: true })
  origin?: DeliveryPreferenceOrigin | null;

  @Field(() => String, { nullable: true })
  reason?: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  changedAt?: Date | null;

  @Field(() => MailLogRecipient, { nullable: true })
  changedBy?: MailLogRecipient | null;

  @Field({
    description:
      'Whether the postal address is complete enough for letters; letters cannot be chosen otherwise.',
  })
  canReceiveLetters!: boolean;
}

@ObjectType()
export class DeliverySuggestionEmailQuality {
  @Field(() => EmailQualityLevel)
  level!: EmailQualityLevel;

  @Field()
  reason!: string;

  @Field(() => GraphQLISODateTime)
  since!: Date;
}

@ObjectType()
export class DeliverySuggestionModel {
  @Field()
  id!: string;

  @Field(() => DeliverySuggestionKind)
  kind!: DeliverySuggestionKind;

  @Field({ description: 'Why, e.g. emailQuality:dead or placeholderEmail.' })
  reason!: string;

  @Field(() => GraphQLISODateTime, { description: 'Suggested since.' })
  createdAt!: Date;

  @Field(() => MailLogRecipient)
  user!: MailLogRecipient;

  @Field(() => DeliverySuggestionEmailQuality, { nullable: true })
  emailQuality?: DeliverySuggestionEmailQuality | null;
}

@ObjectType()
export class PaginatedDeliverySuggestions {
  @Field(() => [DeliverySuggestionModel])
  nodes!: DeliverySuggestionModel[];

  @Field(() => Int)
  totalCount!: number;
}

@ObjectType()
export class DeliverySuggestionCounts {
  @Field(() => Int)
  toLetter!: number;

  @Field(() => Int)
  toMail!: number;
}

@ObjectType()
export class DeliveryModeAudiencePreview {
  @Field(() => Int, { description: 'People in the audience.' })
  userCount!: number;

  @Field(() => Int, {
    description:
      'People without a usable postal address; they are skipped when moving to letters.',
  })
  withoutAddressCount!: number;
}

@ObjectType()
export class DeliveryModeBulkResult {
  @Field(() => Int)
  changed!: number;

  @Field(() => Int)
  skippedWithoutAddress!: number;
}

@ObjectType()
export class DeliverySuggestionConfirmAllResult {
  @Field(() => Int)
  confirmed!: number;

  @Field(() => Int, { description: 'Suggestions that no longer applied.' })
  skipped!: number;
}

@ObjectType()
export class DeliverySuggestionRecomputeResult {
  @Field(() => Int)
  toLetter!: number;

  @Field(() => Int)
  toMail!: number;

  @Field(() => Int, { description: 'Suggestions that no longer apply.' })
  removed!: number;
}
