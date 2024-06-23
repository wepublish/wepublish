import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'
import {Event} from '@wepublish/event/api'
import {BlockType} from '../block-type'

// Objects

@ObjectType()
export class EventBlockFilter {
  @Field(() => [ID], {nullable: true})
  tags?: string[]

  @Field(() => [ID], {nullable: true})
  events?: string[]
}

@ObjectType()
export class EventBlock {
  @Field()
  type: BlockType = BlockType.Event

  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => EventBlockFilter)
  filter!: EventBlockFilter

  @Field(() => [Event])
  events!: Event[]
}

// Inputs

@InputType()
export class EventBlockFilterInput extends OmitType(EventBlockFilter, [], InputType) {}

@InputType()
export class EventBlockInput extends OmitType(EventBlock, ['events', 'filter'], InputType) {
  @Field(() => EventBlockFilterInput)
  filter!: EventBlockFilterInput
}
