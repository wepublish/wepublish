import {Directive, Field, ObjectType} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Subscription {
  @Field()
  @Directive('@external')
  id!: string
}
