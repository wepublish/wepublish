import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { MailTemplateStatus, PlaceholderScope } from '@wepublish/mail/api';
import { SubscriptionEvent, UserEvent } from '@prisma/client';

registerEnumType(MailTemplateStatus, {
  name: 'MailTemplateStatus',
});

registerEnumType(PlaceholderScope, {
  name: 'PlaceholderScope',
});

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent',
});

registerEnumType(UserEvent, {
  name: 'UserEvent',
});

@ObjectType()
export class MailTemplateWithUrlAndStatusModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  externalMailTemplateId!: string;

  @Field()
  remoteMissing!: boolean;

  @Field()
  url!: string;

  @Field()
  status!: string;
}

@ObjectType()
export class MailProviderCapabilitiesModel {
  @Field()
  canCreateTemplates!: boolean;

  @Field()
  canUpdateTemplates!: boolean;

  @Field()
  canDeleteTemplates!: boolean;

  @Field()
  supportsTemplateSubject!: boolean;

  @Field()
  templateNameIsImmutable!: boolean;
}

@ObjectType()
export class MailPlaceholderSyntaxModel {
  @Field()
  open!: string;

  @Field()
  close!: string;
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string;

  @Field(() => MailProviderCapabilitiesModel)
  capabilities!: MailProviderCapabilitiesModel;

  @Field(() => MailPlaceholderSyntaxModel)
  placeholderSyntax!: MailPlaceholderSyntaxModel;
}

@ObjectType()
export class MailTemplateContentModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  externalMailTemplateId!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  subject?: string;

  @Field()
  html!: string;
}

@ObjectType()
export class MailPlaceholderModel {
  @Field()
  key!: string;

  @Field()
  description!: string;

  @Field(() => PlaceholderScope)
  scope!: PlaceholderScope;

  @Field({ nullable: true })
  event?: string;
}

@ObjectType()
export class MailPlaceholderGroupModel {
  @Field(() => PlaceholderScope)
  scope!: PlaceholderScope;

  @Field()
  event!: string;

  @Field(() => [MailPlaceholderModel])
  placeholders!: MailPlaceholderModel[];
}

@InputType()
export class CreateMailTemplateInput {
  @Field()
  name!: string;

  @Field()
  html!: string;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
export class UpdateMailTemplateInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  html?: string;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  description?: string;
}
