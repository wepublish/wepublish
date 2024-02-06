import {Field, Float, Int, ObjectType} from '@nestjs/graphql'
import {GraphQLRichText} from '@wepublish/richtext/api'

@ObjectType()
export class FocalPoint {
  @Field(type => Float)
  x!: number

  @Field(type => Float)
  y!: number
}

@ObjectType()
export class Image {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field({nullable: true})
  filename?: string

  @Field({nullable: true})
  title?: string

  @Field(type => GraphQLRichText, {nullable: true})
  description?: string

  @Field(type => [String])
  tags!: string[]

  @Field({nullable: true})
  link?: string

  @Field({nullable: true})
  source?: string

  @Field({nullable: true})
  license?: string

  @Field(type => Int)
  fileSize!: number

  @Field()
  extension!: string

  @Field()
  mimeType!: string

  @Field()
  format!: string

  @Field(type => Int)
  width!: number

  @Field(type => Int)
  height!: number

  @Field(type => FocalPoint, {nullable: true})
  focalPoint?: FocalPoint
}
