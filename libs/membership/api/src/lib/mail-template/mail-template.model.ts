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

  @Field(() => String, {
    nullable: true,
    description:
      'Stationery a letter printed from this template is set on; null means the default.',
  })
  letterLayoutId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Uploaded pdf printed after the letter pages, e.g. a QR-bill.',
  })
  letterAppendixId?: string | null;

  @Field()
  status!: string;
}

export const ATTACHMENT_IDS_DESCRIPTION =
  'Word documents (.docx) filled in with the same placeholders, converted to pdf and attached to every mail sent from this template, in this order. A printed letter carries them after its pages.';

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

  @Field(() => String, { nullable: true })
  letterLayoutId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Uploaded pdf printed after the letter pages, e.g. a QR-bill.',
  })
  letterAppendixId?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: `${ATTACHMENT_IDS_DESCRIPTION} Left out, the attachments stay as they are.`,
  })
  attachmentIds?: string[] | null;
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
export class MailTemplateLetterPreviewModel {
  @Field({ description: 'The rendered letter as a base64 encoded pdf.' })
  pdf!: string;
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

  @Field(() => String, {
    nullable: true,
    description:
      'Stationery to show a letter preview on; null for the default.',
  })
  letterLayoutId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Uploaded pdf printed after the letter pages, e.g. a QR-bill.',
  })
  letterAppendixId?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: 'Attachments chosen on the draft, possibly not saved yet.',
  })
  attachmentIds?: string[] | null;
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

  @Field(() => [String], {
    nullable: true,
    description: 'Attachments chosen on the draft, possibly not saved yet.',
  })
  attachmentIds?: string[] | null;
}
