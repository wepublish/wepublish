import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TotpSetup {
  @Field({ description: 'Base32 encoded TOTP secret' })
  secret!: string;

  @Field({ description: 'OTPAuth URI for authenticator apps' })
  uri!: string;
}
