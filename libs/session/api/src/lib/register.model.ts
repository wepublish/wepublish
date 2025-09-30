import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { ChallengeInput } from '@wepublish/challenge/api';
import { User, UserAddressInput } from '@wepublish/user/api';
import { SessionWithTokenWithoutUser } from './session.model';

@ObjectType()
export class Registration {
  @Field()
  user!: User;

  @Field(() => SessionWithTokenWithoutUser)
  session!: SessionWithTokenWithoutUser;
}

@ArgsType()
export class MemberRegistrationInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field()
  email!: string;

  @Field(() => UserAddressInput, { nullable: true })
  address?: UserAddressInput;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  birthday?: Date;

  @Field(() => ChallengeInput)
  challengeAnswer!: ChallengeInput;
}
