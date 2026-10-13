import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GateNewsletterParam } from '@wepublish/gate/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';

/**
 * The audience of a content gate as the website knows it. Content gates are
 * stored as gates with the audience LOGGED_OUT or UNSUBSCRIBED.
 */
export enum ContentGateAudience {
  ANONYMOUS = 'ANONYMOUS',
  NON_SUBSCRIBERS = 'NON_SUBSCRIBERS',
}

registerEnumType(ContentGateAudience, {
  name: 'ContentGateAudience',
  description: `Who a content gate is meant for.
ANONYMOUS: logging in lifts the gate.
NON_SUBSCRIBERS: only an active subscription lifts the gate.`,
});

@ObjectType()
export class ContentGate {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field()
  active!: boolean;

  @Field(() => ContentGateAudience)
  audience!: ContentGateAudience;

  @Field(() => Int, {
    description: 'Articles a reader can read before the first gate appears.',
  })
  freeArticles!: number;

  @Field(() => Int, {
    description:
      'Articles on which the dismissible soft gate appears before the hard gate.',
  })
  softGateArticles!: number;

  @Field(() => Int, {
    description: 'Blocks of a gated article that are sent before the gate.',
  })
  previewBlocks!: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Reads older than this many days stop counting.',
  })
  meterWindowDays?: number | null;

  @Field(() => GraphQLRichText, { nullable: true })
  softDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  hardDescription?: RichtextJSONDocument | null;

  @Field(() => String, { nullable: true })
  ctaLabel?: string | null;

  @Field(() => String, { nullable: true })
  ctaUrl?: string | null;

  @Field(() => [GateNewsletterParam], {
    description:
      'Query params that mark a visit as coming from a newsletter, e.g. utm_medium=email.',
  })
  newsletterParams!: GateNewsletterParam[];

  @Field({ description: 'Never gate articles opened from a newsletter.' })
  newsletterNeverGate!: boolean;

  @Field(() => Int, {
    description:
      'Articles opened from a newsletter that are neither gated nor counted.',
  })
  newsletterFreeArticles!: number;
}
