import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { KnowledgeProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(KnowledgeProviderType, {
  name: 'KnowledgeProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingKnowledgeProvider extends SettingProvider {
  @Field(type => KnowledgeProviderType)
  type!: KnowledgeProviderType;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  tenant?: string;

  @Field()
  enabled!: boolean;

  /** hide sensitive fields
  @Field({ nullable: true })
  token?: string;
   **/
}

@InputType()
export class SettingKnowledgeProviderFilter extends PartialType(
  PickType(
    SettingKnowledgeProvider,
    ['id', 'type', 'name'] as const,
    InputType
  ),
  InputType
) {}

@ArgsType()
export class UpdateSettingKnowledgeProviderInput extends PartialType(
  OmitType(
    SettingKnowledgeProvider,
    ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
    ArgsType
  ),
  ArgsType
) {
  @Field()
  id!: string;

  /** Written encrypted, never read back through GraphQL. */
  @Field({ nullable: true })
  token?: string;
}
