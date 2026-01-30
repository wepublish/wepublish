import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';
import { AIProviderType } from '@prisma/client';

registerEnumType(AIProviderType, {
  name: 'AIProviderType',
});

@ObjectType()
export class SettingAIProvider {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => AIProviderType)
  type!: AIProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(type => String, { nullable: true })
  systemPrompt?: string;
}

@InputType()
export class SettingAIProviderFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => AIProviderType, { nullable: true })
  type?: AIProviderType;

  @Field(type => String, { nullable: true })
  name?: string;
}

@InputType()
export class CreateSettingAIProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => AIProviderType)
  type!: AIProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(type => String, { nullable: true })
  systemPrompt?: string;
}

@ArgsType()
export class UpdateSettingAIProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => AIProviderType, { nullable: true })
  type?: AIProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(type => String, { nullable: true })
  systemPrompt?: string;
}
