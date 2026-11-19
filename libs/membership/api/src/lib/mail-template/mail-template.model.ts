import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { MailChannel, MailTemplateContext } from '@prisma/client';
import { MailTemplateStatus } from '@wepublish/mail/api';

registerEnumType(MailTemplateStatus, {
  name: 'MailTemplateStatus',
});

// Also used by the send models, which import this file for the registration.
registerEnumType(MailChannel, {
  name: 'MailChannel',
  description: 'Whether a send goes out as an email or as a printed letter.',
});

registerEnumType(MailTemplateContext, {
  name: 'MailTemplateContext',
  description: 'The mail type / context a template is written for.',
});

@ObjectType({
  description: 'What a template says on one channel.',
})
export class MailTemplateVariantModel {
  @Field()
  id!: string;

  @Field(() => MailChannel)
  channel!: MailChannel;

  @Field({
    description:
      "The email's subject line; for a letter the title its log entry carries.",
  })
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field(() => String, {
    nullable: true,
    description: 'Plain-text alternative of an email. Unused for a letter.',
  })
  textContent?: string | null;

  @Field({
    description:
      'Letter only: the letter says what the email says. Its own subject and body are empty then; sends read the email version.',
  })
  sameAsMail!: boolean;

  @Field(() => String, {
    nullable: true,
    description:
      'Letter only: stationery the letter is set on; null means the default.',
  })
  letterLayoutId?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'Letter only: uploaded pdf printed after the letter pages, e.g. a QR-bill.',
  })
  letterAppendixId?: string | null;
}

@ObjectType({
  description: 'A member plan whose communication flow sends a template.',
})
export class MailTemplateMemberPlanModel {
  @Field()
  id!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class MailTemplateModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

  // Declared here as a string, as it always was: left to the resolver alone,
  // the field would turn into the enum and its values change case on the wire
  // (`ok` → `Ok`).
  @Field()
  status!: string;

  // `channels`, `variants`, `subject`, the table fields (`letterLayoutName`,
  // `letterAppendixName`, `memberPlans`) and the deprecated content fields are
  // resolved by `MailTemplatesResolver`.
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string;
}

@InputType()
export class MailTemplateVariantInput {
  @Field(() => MailChannel)
  channel!: MailChannel;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field(() => String, { nullable: true })
  textContent?: string | null;

  @Field(() => Boolean, {
    nullable: true,
    description:
      'Letter only: take subject and body from the email version, which the template must have. The subject and body handed in are ignored.',
  })
  sameAsMail?: boolean | null;

  @Field(() => String, { nullable: true })
  letterLayoutId?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Uploaded pdf printed after the letter pages, e.g. a QR-bill.',
  })
  letterAppendixId?: string | null;
}

export const ATTACHMENT_IDS_DESCRIPTION =
  'Word documents (.docx) filled in with the same placeholders, converted to pdf and attached to every mail sent from this template, in this order. A printed letter carries them after its pages.';

@InputType()
export class MailTemplateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => MailTemplateContext, { nullable: true })
  context?: MailTemplateContext;

  @Field(() => [MailTemplateVariantInput], {
    description:
      'The versions to write, one per channel. A version left out stays as it is; removing one is `deleteMailTemplateVariant`.',
  })
  variants!: MailTemplateVariantInput[];

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
