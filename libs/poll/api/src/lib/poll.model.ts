import {Field, ID, ObjectType, Directive} from '@nestjs/graphql'

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class FullPoll {
  @Field(() => ID)
  @Directive('@external')
  id!: string
}
