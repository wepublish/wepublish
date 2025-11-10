import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { User } from '@wepublish/user/api';
import { Consent } from '../consent/consent.model';

@ObjectType()
export class UserConsent {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field(type => Consent)
  consent!: Consent;

  userId!: string;

  @Field(type => User)
  user?: User;

  @Field()
  value!: boolean;
}

@ArgsType()
export class UserConsentInput {
  @Field()
  consentId!: string;

  @Field()
  userId!: string;

  @Field()
  value!: boolean;
}

@ArgsType()
export class UserConsentFilter {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  value?: boolean;
}
