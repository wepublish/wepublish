import {ArgsType, Field, InputType, ObjectType} from '@nestjs/graphql'
import {ChallengeInput} from '@wepublish/challenge/api'
import {User} from '@wepublish/user/api'
import {SessionWithTokenWithoutUser} from '@wepublish/session/api'

@ObjectType()
export class Registration {
  @Field()
  user!: User

  @Field(() => SessionWithTokenWithoutUser)
  session!: SessionWithTokenWithoutUser
}

@InputType()
export class UserAddressInput {
  @Field({nullable: true})
  company?: string

  @Field({nullable: true})
  streetAddress?: string

  @Field({nullable: true})
  streetAddress2?: string

  @Field({nullable: true})
  zipCode?: string

  @Field({nullable: true})
  city?: string

  @Field({nullable: true})
  country?: string
}

@ArgsType()
export class MemberRegistrationInput {
  @Field()
  name!: string

  @Field({nullable: true})
  firstName?: string

  @Field()
  email!: string

  @Field(() => UserAddressInput, {nullable: true})
  address?: UserAddressInput

  @Field({nullable: true})
  password?: string

  @Field({nullable: true})
  birthday?: Date

  @Field(() => ChallengeInput)
  challengeAnswer!: ChallengeInput
}
