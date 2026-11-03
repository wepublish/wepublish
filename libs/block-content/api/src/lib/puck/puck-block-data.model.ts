import { Field, ObjectType } from '@nestjs/graphql';
import type { Subscription } from '@prisma/client';
import { Article } from '@wepublish/article/api';
import { Event } from '@wepublish/event/api';
import { Image } from '@wepublish/image/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import { Page } from '@wepublish/page/api';
import {
  ApiPuckRegistry,
  FlatPuckBlock,
  PuckBlock,
  PuckRegistry,
} from '@wepublish/puck-content/api';

@ObjectType({
  description:
    'The current content of the block template a linked Puck block points at.',
})
export class PuckBlockTemplateData {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => [PuckBlock], {
    description:
      'The blocks of the template, read flat like revision puckBlocks. Their ids are prefixed with the id of the linked block, and linked templates inside the template sit in the `template` slot of their linked block.',
  })
  puckBlocks!: FlatPuckBlock[];

  @Field(() => PuckRegistry, { nullable: true })
  puckRegistry!: ApiPuckRegistry | null;
}

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

  @Field(() => PuckBlockTemplateData, {
    nullable: true,
    description:
      'For a linked block template: the template it points at, null when it is missing, links back to itself or is nested too deep.',
  })
  template?: PuckBlockTemplateData | null;
}

export const emptyPuckBlockData: PuckBlockData = {
  articles: null,
  pages: null,
  events: null,
  images: null,
  memberPlans: null,
  userSubscriptions: null,
};
