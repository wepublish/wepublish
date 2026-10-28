import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  EngagementRequirement,
  NewsletterReferralMode,
} from '@prisma/client';
import { Image } from '@wepublish/image/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';

registerEnumType(EngagementGoal, {
  name: 'EngagementGoal',
  description: `What a rule promotes. An announcement is one soft stage from the first article on.`,
});

registerEnumType(EngagementAudience, {
  name: 'EngagementAudience',
  description: `Who a rule is for, decided from the session.`,
});

registerEnumType(EngagementPlacement, { name: 'EngagementPlacement' });

registerEnumType(EngagementEnforcement, {
  name: 'EngagementEnforcement',
  description: `A soft stage can be dismissed, a hard stage cuts the article down to its preview blocks.`,
});

registerEnumType(EngagementRequirement, {
  name: 'EngagementRequirement',
  description: `What a reader needs to get past a hard stage.`,
});

registerEnumType(EngagementActionType, { name: 'EngagementActionType' });

registerEnumType(NewsletterReferralMode, {
  name: 'NewsletterReferralMode',
  description: `Whether readers coming from a newsletter link may read the linked article past the meter.`,
});

registerEnumType(EngagementActionRole, { name: 'EngagementActionRole' });

export enum EngagementDocumentType {
  ARTICLE = 'ARTICLE',
  PAGE = 'PAGE',
}

registerEnumType(EngagementDocumentType, { name: 'EngagementDocumentType' });

@ObjectType()
export class NewsletterParam {
  @Field()
  key!: string;

  @Field()
  value!: string;
}

@InputType()
export class NewsletterParamInput {
  @Field()
  key!: string;

  @Field({ defaultValue: '' })
  value!: string;
}

@ObjectType()
export class EngagementAction {
  @Field()
  id!: string;

  @Field(() => EngagementActionType)
  type!: EngagementActionType;

  @Field({ description: `Empty for the website's default label of the type.` })
  label!: string;

  @Field()
  url!: string;

  @Field()
  style!: string;

  @Field(() => EngagementActionRole)
  role!: EngagementActionRole;
}

@InputType()
export class EngagementActionInput {
  @Field(() => EngagementActionType, { defaultValue: EngagementActionType.URL })
  type!: EngagementActionType;

  @Field({ defaultValue: '' })
  label!: string;

  @Field({ defaultValue: '' })
  url!: string;

  @Field({ defaultValue: '' })
  style!: string;

  @Field(() => EngagementActionRole, {
    defaultValue: EngagementActionRole.OTHER,
  })
  role!: EngagementActionRole;
}

@ObjectType()
export class EngagementStage {
  @Field()
  id!: string;

  @Field(() => Int, {
    description: `Shown once the reader read this many other articles in the window.`,
  })
  afterArticles!: number;

  @Field(() => EngagementPlacement)
  placement!: EngagementPlacement;

  @Field(() => EngagementEnforcement)
  enforcement!: EngagementEnforcement;

  @Field(() => EngagementRequirement, { nullable: true })
  requirement?: EngagementRequirement | null;

  @Field(() => Int, { nullable: true })
  previewBlocks?: number | null;

  @Field()
  dismissible!: boolean;

  @Field(() => Int)
  hideForMinutes!: number;

  @Field(() => Int)
  delaySeconds!: number;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  text?: string | null;

  @Field(() => String, { nullable: true })
  cta?: string | null;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: RichtextJSONDocument | null;

  @Field(() => String, { nullable: true })
  html?: string | null;

  @Field(() => String, { nullable: true })
  embedUrl?: string | null;

  @Field(() => String, { nullable: true })
  imageId?: string | null;

  @Field(() => Image, { nullable: true })
  image?: Image | null;

  @Field(() => [EngagementAction])
  actions!: EngagementAction[];
}

@InputType()
export class EngagementStageInput extends OmitType(
  EngagementStage,
  ['id', 'image', 'actions', 'dismissible', 'hideForMinutes', 'delaySeconds'],
  InputType
) {
  @Field({ defaultValue: true })
  dismissible!: boolean;

  @Field(() => Int, { defaultValue: 1440 })
  hideForMinutes!: number;

  @Field(() => Int, { defaultValue: 0 })
  delaySeconds!: number;

  @Field(() => [EngagementActionInput], { defaultValue: [] })
  actions!: EngagementActionInput[];
}

@ObjectType()
export class EngagementRule {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => EngagementGoal)
  goal!: EngagementGoal;

  @Field()
  active!: boolean;

  @Field(() => Int, {
    description: `Higher priorities fill the website's slots first.`,
  })
  priority!: number;

  @Field(() => Int, {
    description: `Bumped on every update, so dismissed prompts show again.`,
  })
  version!: number;

  @Field(() => EngagementAudience)
  audience!: EngagementAudience;

  @Field(() => [String], {
    description: `The plans of the MEMBER_PLANS audience.`,
  })
  audienceMemberPlanIds!: string[];

  @Field()
  showOnArticles!: boolean;

  @Field(() => [String])
  showOnPageIds!: string[];

  @Field()
  includePeeredArticles!: boolean;

  @Field(() => Int, { nullable: true })
  meterWindowDays?: number | null;

  @Field(() => NewsletterReferralMode)
  newsletterReferral!: NewsletterReferralMode;

  @Field(() => Int)
  newsletterReferralLimit!: number;

  @Field(() => [NewsletterParam])
  newsletterParams!: NewsletterParam[];

  @Field(() => [EngagementStage])
  stages!: EngagementStage[];
}

@InputType()
export class CreateEngagementRuleInput {
  @Field()
  name!: string;

  @Field(() => EngagementGoal)
  goal!: EngagementGoal;

  @Field({ defaultValue: true })
  active!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  priority!: number;

  @Field(() => EngagementAudience, { defaultValue: EngagementAudience.ALL })
  audience!: EngagementAudience;

  @Field(() => [String], {
    defaultValue: [],
    description: `Only for the MEMBER_PLANS audience, which needs at least one.`,
  })
  audienceMemberPlanIds?: string[];

  @Field({ defaultValue: true })
  showOnArticles!: boolean;

  @Field(() => [String], { defaultValue: [] })
  showOnPageIds!: string[];

  @Field({ defaultValue: false })
  includePeeredArticles!: boolean;

  @Field(() => Int, { nullable: true })
  meterWindowDays?: number | null;

  @Field(() => NewsletterReferralMode, {
    defaultValue: NewsletterReferralMode.NONE,
  })
  newsletterReferral!: NewsletterReferralMode;

  @Field(() => Int, { defaultValue: 0 })
  newsletterReferralLimit!: number;

  @Field(() => [NewsletterParamInput], { defaultValue: [] })
  newsletterParams!: NewsletterParamInput[];

  @Field(() => [EngagementStageInput])
  stages!: EngagementStageInput[];
}

@InputType()
export class UpdateEngagementRuleInput extends CreateEngagementRuleInput {
  @Field()
  id!: string;
}

@ObjectType({
  description: `One stage of a rule that applies to the reader, as the website shows it.`,
})
export class EngagementPrompt {
  @Field()
  ruleId!: string;

  @Field(() => Int)
  ruleVersion!: number;

  @Field(() => EngagementGoal)
  goal!: EngagementGoal;

  @Field(() => EngagementStage)
  stage!: EngagementStage;
}

@ArgsType()
export class EngagementPromptsArgs {
  @Field(() => EngagementDocumentType)
  documentType!: EngagementDocumentType;

  @Field()
  documentId!: string;

  @Field({
    nullable: true,
    description: `A paywall bypass token, checked on the server, for rules shown to readers with a bypass.`,
  })
  paywallBypassToken?: string;
}
