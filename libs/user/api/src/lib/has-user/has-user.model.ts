import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {User} from '../user.model'

@InterfaceType()
export abstract class HasOptionalUser {
  @Field(() => ID, {nullable: true})
  userID?: string

  @Field(() => User, {nullable: true})
  user?: User
}

@InterfaceType()
export abstract class HasUser {
  @Field(() => ID)
  userID!: string

  @Field(() => User)
  user!: User
}

// New Style

@InterfaceType()
export abstract class HasUserLc {
  @Field(() => ID)
  userId!: string

  @Field(() => User)
  user!: User
}

@InterfaceType()
export abstract class HasOptionalUserLc {
  @Field(() => ID, {nullable: true})
  userId?: string

  @Field(() => User, {nullable: true})
  user?: User
}
