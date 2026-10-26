import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLSlug } from '@wepublish/utils/api';

@ObjectType()
export class EventRegion {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field({
    description: `A disabled region takes no new organisations or places. Listed only to holders of CAN_GET_OTHER_ORGANIZATIONS or CAN_UPDATE_OTHER_ORGANIZATIONS.`,
  })
  enabled!: boolean;
}

@ObjectType()
export class EventAudience {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;
}

@ObjectType()
export class EventAffiliation {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;
}
