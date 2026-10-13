import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GateActionRole, GateMode, LoginStatus } from '@prisma/client';
import { Image } from '@wepublish/image/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';

registerEnumType(GateMode, {
  name: 'GateMode',
  description: `What a gate is used as. Each mode uses its own subset of the fields of a Gate.`,
});

registerEnumType(GateActionRole, {
  name: 'GateActionRole',
});

registerEnumType(LoginStatus, {
  name: 'LoginStatus',
});

export enum BannerDocumentType {
  PAGE,
  ARTICLE,
}

/*
This is only here to provide the interface for the "showOnPages" field
and can be removed when Pages are moved to APIv2
*/
@ObjectType()
export class PageModel {
  @Field()
  id!: string;
}

// Keeps the GraphQL name the website already selects on Article.contentGate.
@ObjectType('ContentGateNewsletterParam')
@InputType('ContentGateNewsletterParamInput')
export class GateNewsletterParam {
  @Field()
  key!: string;

  @Field()
  value!: string;
}

@ObjectType()
export class GateAction {
  @Field()
  id!: string;

  @Field()
  label!: string;

  @Field()
  url!: string;

  @Field()
  style!: string;

  @Field(() => GateActionRole)
  role!: GateActionRole;
}

@InputType()
export class GateActionInput {
  @Field()
  label!: string;

  @Field()
  url!: string;

  @Field({ nullable: true })
  style?: string;

  @Field(() => GateActionRole, { nullable: true })
  role?: GateActionRole;
}

@ObjectType()
export class GateBypass {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  token!: string;

  @Field()
  gateId!: string;
}

@ObjectType()
export class Gate {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field(() => GateMode)
  mode!: GateMode;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field()
  active!: boolean;

  @Field(() => LoginStatus)
  audience!: LoginStatus;

  @Field()
  anyMemberPlan!: boolean;

  @Field(() => [MemberPlan])
  memberPlans?: MemberPlan[];

  @Field(() => [GateBypass])
  bypasses?: GateBypass[];

  @Field()
  showOnArticles!: boolean;

  @Field(() => [PageModel])
  showOnPages?: PageModel[];

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  text?: string | null;

  @Field(() => String, { nullable: true })
  cta?: string | null;

  @Field(() => String, { nullable: true })
  html?: string | null;

  @Field(() => String, { nullable: true })
  embedUrl?: string | null;

  @Field(() => String, { nullable: true })
  imageId?: string | null;

  @Field(() => Image, { nullable: true })
  image?: Image | null;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  upgradeDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  circumventDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  upgradeCircumventDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  softDescription?: RichtextJSONDocument | null;

  @Field(() => [GateAction])
  actions?: GateAction[];

  @Field(() => Int, {
    nullable: true,
    description: 'Blocks of a gated article that are shown before the gate.',
  })
  previewBlocks?: number | null;

  @Field()
  fadeout!: boolean;

  @Field(() => Int, { nullable: true })
  freeArticles?: number | null;

  @Field(() => Int, { nullable: true })
  softGateArticles?: number | null;

  @Field(() => Int, { nullable: true })
  meterWindowDays?: number | null;

  @Field(() => [GateNewsletterParam])
  newsletterParams?: GateNewsletterParam[] | null;

  @Field()
  newsletterNeverGate!: boolean;

  @Field(() => Int)
  newsletterFreeArticles!: number;

  @Field()
  collapsible!: boolean;

  @Field(() => Int)
  hideForMinutes!: number;

  @Field(() => Int)
  delay!: number;
}

@InputType({ isAbstract: true })
export class GateInputBase {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field({ nullable: true })
  active?: boolean;

  @Field(() => LoginStatus, { nullable: true })
  audience?: LoginStatus;

  @Field({ nullable: true })
  anyMemberPlan?: boolean;

  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[];

  @Field(() => [String], { nullable: true })
  bypassTokens?: string[];

  @Field({ nullable: true })
  showOnArticles?: boolean;

  @Field(() => [String], { nullable: true })
  showOnPageIds?: string[];

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  text?: string | null;

  @Field(() => String, { nullable: true })
  cta?: string | null;

  @Field(() => String, { nullable: true })
  html?: string | null;

  @Field(() => String, { nullable: true })
  embedUrl?: string | null;

  @Field(() => String, { nullable: true })
  imageId?: string | null;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  upgradeDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  circumventDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  upgradeCircumventDescription?: RichtextJSONDocument | null;

  @Field(() => GraphQLRichText, { nullable: true })
  softDescription?: RichtextJSONDocument | null;

  @Field(() => [GateActionInput], { nullable: true })
  actions?: GateActionInput[];

  @Field(() => Int, { nullable: true })
  previewBlocks?: number | null;

  @Field({ nullable: true })
  fadeout?: boolean;

  @Field(() => Int, { nullable: true })
  freeArticles?: number | null;

  @Field(() => Int, { nullable: true })
  softGateArticles?: number | null;

  @Field(() => Int, { nullable: true })
  meterWindowDays?: number | null;

  @Field(() => [GateNewsletterParam], { nullable: true })
  newsletterParams?: GateNewsletterParam[];

  @Field({ nullable: true })
  newsletterNeverGate?: boolean;

  @Field(() => Int, { nullable: true })
  newsletterFreeArticles?: number;

  @Field({ nullable: true })
  collapsible?: boolean;

  @Field(() => Int, { nullable: true })
  hideForMinutes?: number;

  @Field(() => Int, { nullable: true })
  delay?: number;
}

@InputType()
export class CreateGateInput extends GateInputBase {
  @Field(() => GateMode)
  mode!: GateMode;
}

@InputType()
export class UpdateGateInput extends GateInputBase {
  @Field()
  id!: string;
}

@ArgsType()
export class GatesArgs {
  @Field(() => GateMode)
  mode!: GateMode;

  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  take?: number;
}

export type PrimaryBannerQuery = {
  documentType: BannerDocumentType;
  documentId: string;
  loggedIn: boolean;
  hasSubscription: boolean;
  hasPaywallBypass: boolean;
};
