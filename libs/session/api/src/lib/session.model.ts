import {Field, ObjectType, OmitType} from '@nestjs/graphql'
import {User} from '@wepublish/user/api'

@ObjectType()
export class SessionWithToken {
  @Field()
  token!: string

  @Field()
  createdAt!: Date

  @Field()
  expiresAt!: Date

  @Field(() => User)
  user!: User
}

@ObjectType()
export class SessionWithTokenWithoutUser extends OmitType(
  SessionWithToken,
  ['user'] as const,
  ObjectType
) {}
