import {
  ArgsType,
  Field,
  InterfaceType,
  ObjectType,
  PartialType,
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

  @Field(() => [String], {
    description:
      'The user roles whose permissions a request with this token gets.',
  })
  roleIDs!: string[];
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
export class CreateTokenInput {
  @Field()
  name!: string;

  @Field(() => [String], {
    nullable: true,
    description:
      'User roles for the token. Without roles a token has no permissions.',
  })
  roleIDs?: string[];
}

@ArgsType()
export class UpdateTokenInput extends PartialType(CreateTokenInput, ArgsType) {
  @Field()
  id!: string;
}
