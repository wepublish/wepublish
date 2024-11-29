import {Directive, Field, ID, ObjectType} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Comment {
  @Field(() => ID)
  @Directive('@external')
  id!: string
}
