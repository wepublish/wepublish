import {ObjectType, Field, InputType, OmitType} from '@nestjs/graphql'

// Object Types
@ObjectType()
export class Property {
  @Field(() => String)
  key!: string

  @Field(() => String)
  value!: string

  @Field(() => Boolean)
  public!: boolean
}

// Input Types
@InputType()
export class PropertyInput extends Property {}

@InputType()
export class PublicProperty extends OmitType(PropertyInput, ['public']) {}
