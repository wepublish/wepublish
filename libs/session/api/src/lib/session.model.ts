import { Field, ObjectType, OmitType, registerEnumType } from '@nestjs/graphql';
import { SessionOrigin } from '@prisma/client';
import { LoginCodeSecondFactor } from '@wepublish/login-code/api';
// eslint-disable-next-line no-restricted-imports
import { SensitiveDataUser } from '@wepublish/user/api';

registerEnumType(SessionOrigin, {
  name: 'SessionOrigin',
});

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

  @Field(() => Boolean, {
    description:
      'Whether this session was created by redeeming an impersonation grant from the One dashboard. Clients must never treat an ordinary JWT login as impersonation.',
  })
  impersonated!: boolean;

  @Field(() => SessionOrigin, {
    description: 'How this session was created.',
  })
  origin!: SessionOrigin;

  @Field(() => Boolean, {
    description:
      'Whether this session is limited to onboarding until a real email address has been confirmed.',
  })
  restricted!: boolean;
}

@ObjectType()
export class SessionWithTokenWithoutUser extends OmitType(
  SessionWithToken,
  ['user', 'totpEnabled', 'impersonated', 'origin', 'restricted'] as const,
  ObjectType
) {}

@ObjectType()
export class SessionInfo {
  @Field(() => SessionOrigin)
  origin!: SessionOrigin;

  @Field(() => Boolean)
  restricted!: boolean;

  @Field(() => Boolean)
  placeholderEmail!: boolean;

  @Field(() => LoginCodeSecondFactor, {
    description:
      'Attribute from the letter a restricted session must confirm when it claims the account with a real email address.',
  })
  secondFactor!: LoginCodeSecondFactor;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;
}
