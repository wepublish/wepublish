import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

export enum MailchimpContactStatus {
  Subscribed = 'subscribed',
  Pending = 'pending',
}

registerEnumType(MailchimpContactStatus, {
  name: 'MailchimpContactStatus',
});

@InputType()
export class MailchimpContactInput {
  @Field()
  syncProviderId!: string;

  @Field()
  listId!: string;

  @Field()
  email!: string;

  @Field(() => MailchimpContactStatus)
  status!: MailchimpContactStatus;

  @Field(() => GraphQLJSONObject, { nullable: true })
  mergeFields?: Record<string, string>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  interests?: Record<string, boolean>;
}

@ObjectType()
export class MailchimpSubscribeResult {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  error?: string;
}
