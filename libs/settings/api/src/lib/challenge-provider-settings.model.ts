import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';
import { ChallengeProviderType } from '@prisma/client';

// Register the enum for GraphQL
registerEnumType(ChallengeProviderType, {
  name: 'ChallengeProviderType',
});

@ObjectType()
export class SettingChallengeProvider {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => Date)
  lastLoadedAt!: Date;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => ChallengeProviderType)
  type!: ChallengeProviderType;
  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  secret?: string;

  @Field(type => String, { nullable: true })
  siteKey?: string;
    **/
}

@InputType()
export class SettingChallengeProviderFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => ChallengeProviderType, { nullable: true })
  type?: ChallengeProviderType;

  @Field(type => String, { nullable: true })
  name?: string;
}

@InputType()
export class CreateSettingChallengeProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => ChallengeProviderType)
  type!: ChallengeProviderType;

  @Field(type => String, { nullable: true })
  secret?: string;

  @Field(type => String, { nullable: true })
  siteKey?: string;
}

@ArgsType()
export class UpdateSettingChallengeProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  secret?: string;

  @Field(type => String, { nullable: true })
  siteKey?: string;
}
