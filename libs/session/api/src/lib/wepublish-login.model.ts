import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'Where the editor sends a We.Publish admin to sign in with auth.wepublish.cloud.',
})
export class WepublishLoginClient {
  @Field()
  authorizationUrl!: string;

  @Field()
  clientId!: string;

  @Field()
  redirectUri!: string;

  @Field()
  scope!: string;
}
