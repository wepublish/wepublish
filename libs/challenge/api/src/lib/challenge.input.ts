import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ChallengeInput {
  @Field()
  challengeID!: string;

  @Field()
  challengeSolution!: string;
}
