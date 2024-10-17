import {Field, ID, ObjectType} from '@nestjs/graphql'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {Event} from '@wepublish/event/api'

@ObjectType()
export class EventBlockFilter {
  @Field(() => [ID])
  tags!: string[]

  @Field(() => [ID])
  events!: string[]
}

@ObjectType({
  implements: BaseBlock
})
export class EventBlock extends BaseBlock<typeof BlockType.HTML> {
  @Field(() => EventBlockFilter)
  filter!: EventBlockFilter

  @Field(() => [Event])
  events!: Event[]
}
