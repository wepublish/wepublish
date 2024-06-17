import {Field, ID, InputType, ObjectType, OmitType} from '@nestjs/graphql'

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
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => EventBlockFilter)
  filter!: EventBlockFilter

  @Field(() => [Event])
  events!: Event[]
}

// Inputs

@InputType()
export class EventBlockInputFilter extends EventBlockFilter {}

@InputType()
export class EventBlockInput extends OmitType(EventBlock, ['events']) {}
