import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { NewsletterSubscriberSource } from '@prisma/client';
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser } from '@wepublish/user/api';
import { PaginatedType } from '@wepublish/utils/api';

export enum NewsletterSubscriberStatus {
  SUBSCRIBED = 'SUBSCRIBED',
  PENDING = 'PENDING',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
}

registerEnumType(NewsletterSubscriberStatus, {
  name: 'NewsletterSubscriberStatus',
});

registerEnumType(NewsletterSubscriberSource, {
  name: 'NewsletterSubscriberSource',
});

@ObjectType()
export class NewsletterSubscriber {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  userId!: string;
  listId!: string;

  @Field(() => SensitiveDataUser)
  user?: SensitiveDataUser;

  @Field(() => NewsletterSubscriberSource)
  source!: NewsletterSubscriberSource;

  @Field(() => NewsletterSubscriberStatus)
  status!: NewsletterSubscriberStatus;

  @Field()
  receiving!: boolean;

  @Field()
  subscribedAt!: Date;

  @Field(() => Date, { nullable: true })
  confirmedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  unsubscribedAt?: Date | null;
}

@ObjectType()
export class PaginatedNewsletterSubscribers extends PaginatedType(
  NewsletterSubscriber
) {}

@ObjectType()
export class NewsletterSubscriberCounts {
  @Field(() => Int)
  subscribed!: number;

  @Field(() => Int)
  pending!: number;

  @Field(() => Int)
  unsubscribed!: number;
}

@InputType()
export class NewsletterSubscriberFilter {
  @Field(() => NewsletterSubscriberStatus, { nullable: true })
  status?: NewsletterSubscriberStatus;

  @Field({ nullable: true })
  q?: string;
}
