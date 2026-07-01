import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { MailTemplateContext } from '@prisma/client';
import { MailTemplateStatus } from '@wepublish/mail/api';

registerEnumType(MailTemplateStatus, {
  name: 'MailTemplateStatus',
});

registerEnumType(MailTemplateContext, {
  name: 'MailTemplateContext',
  description: 'The mail type / context a template is written for.',
});

@ObjectType()
export class MailTemplateModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

  @Field()
  status!: string;
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string;
}

@InputType()
export class MailTemplateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;
}

@ObjectType()
export class MailTemplatePreviewModel {
  @Field()
  subject!: string;

  @Field()
  html!: string;

  @Field({ nullable: true })
  text?: string;
}

@ObjectType()
export class MailTemplateSubscriptionOption {
  @Field()
  id!: string;

  @Field()
  label!: string;
}

@InputType()
export class MailTemplatePreviewInput {
  @Field({ description: 'Mail type / context id, e.g. "renewal".' })
  contextId!: string;

  @Field({
    nullable: true,
    description: 'Subscription to take sample data from.',
  })
  subscriptionId?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;
}

@InputType()
export class SendTestMailTemplateInput {
  @Field()
  contextId!: string;

  @Field({ nullable: true })
  subscriptionId?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;
}
