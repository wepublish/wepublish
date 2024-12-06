import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
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

@InputType()
export class EventBlockFilterInput extends OmitType(EventBlockFilter, [] as const, InputType) {}

@ObjectType({
  implements: BaseBlock
})
export class EventBlock extends BaseBlock<typeof BlockType.Event> {
  @Field(() => EventBlockFilter)
  filter!: EventBlockFilter

  @Field(() => [Event])
  events!: Event[]
}

@InputType()
export class EventBlockInput {
  @Field(() => EventBlockFilterInput)
  filter!: EventBlockFilterInput
}