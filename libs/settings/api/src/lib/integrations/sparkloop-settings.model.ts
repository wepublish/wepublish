import {
  Field,
  ObjectType,
  ArgsType,
  PartialType,
  OmitType,
} from '@nestjs/graphql';

import { SettingProvider } from './integration.model';

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingSparkloop extends SettingProvider {
  @Field()
  active!: boolean;

  @Field({ nullable: true })
  teamId?: string;
}

@ArgsType()
export class UpdateSettingSparkloopInput extends PartialType(
  OmitType(
    SettingSparkloop,
    ['id', 'createdAt', 'modifiedAt', 'lastLoadedAt'] as const,
    ArgsType
  ),
  ArgsType
) {}
