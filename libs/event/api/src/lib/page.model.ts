import {ObjectType, Field, ID, Directive} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Page {
  @Field(() => ID)
  @Directive('@external')
  id!: string
}
