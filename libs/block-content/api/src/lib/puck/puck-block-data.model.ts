import { Field, ObjectType } from '@nestjs/graphql';
import type { Subscription } from '@prisma/client';
import { Article } from '@wepublish/article/api';
import { Event } from '@wepublish/event/api';
import { Image } from '@wepublish/image/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import { Page } from '@wepublish/page/api';

@ObjectType({
  description:
    'The records the datasources of a Puck block yield, resolved on read. A model is null when the block has no datasource for it.',
})
export class PuckBlockData {
  @Field(() => [Article], { nullable: true })
  articles!: Article[] | null;

  @Field(() => [Page], { nullable: true })
  pages!: Page[] | null;

  @Field(() => [Event], { nullable: true })
  events!: Event[] | null;

  @Field(() => [Image], { nullable: true })
  images!: Image[] | null;

  @Field(() => [MemberPlan], { nullable: true })
  memberPlans!: MemberPlan[] | null;

  userSubscriptions!: Subscription[] | null;
}

export const emptyPuckBlockData: PuckBlockData = {
  articles: null,
  pages: null,
  events: null,
  images: null,
  memberPlans: null,
  userSubscriptions: null,
};
