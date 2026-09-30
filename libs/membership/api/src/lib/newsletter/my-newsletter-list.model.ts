import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum NewsletterListUserStatus {
  SUBSCRIBED = 'SUBSCRIBED',
  PENDING = 'PENDING',
  PAUSED = 'PAUSED',
  NOT_SUBSCRIBED = 'NOT_SUBSCRIBED',
  LOCKED = 'LOCKED',
}

registerEnumType(NewsletterListUserStatus, {
  name: 'NewsletterListUserStatus',
});

@ObjectType()
export class MyNewsletterList {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  lockedText?: string | null;

  @Field(() => String, { nullable: true })
  lockedLinkUrl?: string | null;

  @Field(() => NewsletterListUserStatus)
  status!: NewsletterListUserStatus;
}
