import {GraphQLRichText} from '@wepublish/richtext/api'
import {Directive, Field, Float, InputType, Int, ObjectType, OmitType} from '@nestjs/graphql'
import {FileUpload, GraphQLUpload} from 'graphql-upload'

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
  @Field()
  @Directive('@external')
  id!: string
}

@ObjectType()
export class ImageV2 {
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

@InputType('InputPoint')
export class FocalPointInput extends OmitType(FocalPoint, [] as const, InputType) {}

@InputType()
export class UploadImageInput {
  @Field(() => GraphQLUpload)
  file!: Promise<FileUpload>

  @Field({nullable: true})
  filename?: string

  @Field({nullable: true})
  title?: string

  @Field({nullable: true})
  description?: string

  @Field(() => [String], {nullable: true})
  tags?: string[]

  @Field({nullable: true})
  link?: string

  @Field({nullable: true})
  source?: string

  @Field({nullable: true})
  license?: string

  @Field(() => FocalPointInput, {nullable: true})
  focalPoint?: FocalPointInput
}
