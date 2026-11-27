import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { MailAudienceInput } from './mail-send.model';

@ObjectType()
export class SavedAudienceFilterModel {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => GraphQLJSONObject, {
    description:
      'The MailAudienceInput as it was saved. Rolling dates stay rolling, so the filter means the same thing whenever it is loaded.',
  })
  audience!: Record<string, unknown>;
}

@InputType()
export class CreateSavedAudienceFilterInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => MailAudienceInput)
  audience!: MailAudienceInput;
}

@InputType()
export class UpdateSavedAudienceFilterInput {
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'An empty text removes the description.',
  })
  description?: string | null;

  @Field(() => MailAudienceInput, {
    nullable: true,
    description: 'Replaces the saved filter by this one.',
  })
  audience?: MailAudienceInput | null;
}
