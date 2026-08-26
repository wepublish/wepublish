import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ChallengeInput } from '@wepublish/challenge/api';

@ObjectType()
export class Newsletter {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;
}

@ArgsType()
export class SubscribeToNewsletterArgs {
  @Field()
  newsletterId!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  source?: string;

  @Field(() => ChallengeInput, { nullable: true })
  challenge?: ChallengeInput;
}
