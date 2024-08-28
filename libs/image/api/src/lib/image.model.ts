import {Field, Float, ObjectType, ID, Directive} from '@nestjs/graphql'

@ObjectType()
export class FocalPoint {
  @Field(type => Float)
  x!: number

  @Field(type => Float)
  y!: number
}

@ObjectType()
@Directive('@extends')
@Directive('@key(fields: "id")')
export class Image {
  @Field(() => ID)
  @Directive('@external')
  id!: string
}
