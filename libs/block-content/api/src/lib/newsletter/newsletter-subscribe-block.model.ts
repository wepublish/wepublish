import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { Newsletter } from '@wepublish/mail/api';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';

export enum NewsletterSubscribeBlockField {
  FirstName = 'firstName',
  LastName = 'lastName',
}

registerEnumType(NewsletterSubscribeBlockField, {
  name: 'NewsletterSubscribeBlockField',
});

@ObjectType({ implements: BaseBlock })
export class NewsletterSubscribeBlock extends BaseBlock<
  typeof BlockType.NewsletterSubscribe
> {
  @Field(() => [String], { defaultValue: [] })
  newsletterIds?: string[];

  @Field(() => [Newsletter])
  newsletters!: Newsletter[];

  @Field(() => [NewsletterSubscribeBlockField], { defaultValue: [] })
  additionalFields!: NewsletterSubscribeBlockField[];

  @Field({ nullable: true })
  source?: string;
}

@InputType()
export class NewsletterSubscribeBlockInput extends OmitType(
  NewsletterSubscribeBlock,
  ['type', 'newsletters'] as const,
  InputType
) {}
