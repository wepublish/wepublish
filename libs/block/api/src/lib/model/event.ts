import {Field, ID, InputType, ObjectType} from '@nestjs/graphql'

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
export class EventBlockInputFilter {
  @Field(() => [ID], {nullable: true})
  tags?: string[]

  @Field(() => [ID], {nullable: true})
  events?: string[]
}

@InputType()
export class EventBlockInput {
  @Field(() => String, {nullable: true})
  blockStyle?: string

  @Field(() => EventBlockInputFilter)
  filter!: EventBlockInputFilter
}
