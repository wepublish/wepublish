import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  PartialType,
} from '@nestjs/graphql';

@ObjectType()
export class Consent {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  defaultValue!: boolean;
}

@ArgsType()
export class CreateConsentInput {
  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field()
  defaultValue!: boolean;
}

@ArgsType()
export class UpdateConsentInput extends PartialType(
  CreateConsentInput,
  ArgsType
) {
  @Field()
  id!: string;
}

@InputType()
export class ConsentFilter {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  defaultValue?: boolean;
}
