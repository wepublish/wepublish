import { Field, ObjectType } from '@nestjs/graphql';
import { LoginCodeSecondFactor } from './login-code-second-factor';

@ObjectType()
export class UserLoginCodeStatus {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  expiresAt!: Date;

  @Field()
  maxUses!: number;

  @Field()
  usesRemaining!: number;

  @Field(() => Date, { nullable: true })
  lastUsedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  revokedAt?: Date | null;

  @Field(() => String, { nullable: true })
  issuedBy?: string | null;

  @Field(() => LoginCodeSecondFactor)
  secondFactor!: LoginCodeSecondFactor;

  @Field(() => Boolean, {
    description:
      'Whether the user record holds the attribute the configured second factor asks for.',
  })
  secondFactorAvailable!: boolean;
}

@ObjectType()
export class UserLoginCodeIssue {
  @Field(() => UserLoginCodeStatus)
  status!: UserLoginCodeStatus;

  @Field()
  code!: string;

  @Field()
  purl!: string;
}
