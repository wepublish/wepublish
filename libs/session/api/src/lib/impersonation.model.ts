import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'What the current session may do and whether it is an impersonation.',
})
export class CurrentSession {
  @Field({
    description:
      'Whether the session may impersonate users: a We.Publish login with the impersonate-cms role.',
  })
  canImpersonate!: boolean;

  @Field(() => String, {
    nullable: true,
    description:
      'Who is signed in as this user, if the session is an impersonation.',
  })
  impersonatedBy?: string | null;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;
}

@ObjectType({
  description:
    'A single-use grant the website redeems through createSessionWithJWT within a minute.',
})
export class WebsiteImpersonation {
  @Field()
  token!: string;

  @Field()
  url!: string;
}
