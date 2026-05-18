import { Field, ObjectType, OmitType } from '@nestjs/graphql';
// eslint-disable-next-line no-restricted-imports
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

  @Field(() => Boolean, {
    description:
      'Whether the user has two-factor authentication enabled. If true and the user is an admin, the client must verify TOTP before proceeding.',
  })
  totpEnabled!: boolean;
}

@ObjectType()
export class SessionWithTokenWithoutUser extends OmitType(
  SessionWithToken,
  ['user', 'totpEnabled'] as const,
  ObjectType
) {}
