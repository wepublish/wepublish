import {Field, ObjectType} from '@nestjs/graphql'

@ObjectType('AuthProvider')
export class AuthProvider {
  @Field(() => String)
  name!: string

  @Field(() => String)
  url!: string
}
