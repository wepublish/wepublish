import {Field, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class PermissionObject {
  @Field(() => String)
  id!: string

  @Field(() => String)
  description!: string

  @Field(() => Boolean)
  deprecated!: boolean
}
