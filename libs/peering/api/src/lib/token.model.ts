import {
  ArgsType,
  Field,
  InterfaceType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';

@InterfaceType()
export abstract class BaseToken {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;
}

@ObjectType({
  implements: () => [BaseToken],
})
export class Token extends BaseToken {}

@ObjectType({
  implements: () => [BaseToken],
})
export class TokenWithSecret extends BaseToken {
  @Field()
  token!: string;
}

@ArgsType()
export class CreateTokenInput extends PickType(
  TokenWithSecret,
  ['name'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdateTokenInput extends PartialType(CreateTokenInput, ArgsType) {
  @Field()
  id!: string;
}
