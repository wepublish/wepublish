import {Field, ObjectType, Directive} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class FullPoll {
  @Field()
  @Directive('@external')
  id!: string
}
