import { Field, ObjectType, OmitType } from '@nestjs/graphql';
import { SensitiveDataUser } from '@wepublish/user/api';

@ObjectType()
export class SessionWithToken {
  @Field()
  token!: string;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field(() => SensitiveDataUser)
  user!: SensitiveDataUser;
}

@ObjectType()
export class SessionWithTokenWithoutUser extends OmitType(
  SessionWithToken,
  ['user'] as const,
  ObjectType
) {}
