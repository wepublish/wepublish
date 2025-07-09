import {Field, Float, InputType, Int, ObjectType, OmitType} from '@nestjs/graphql'
import {FileUpload, GraphQLUpload} from 'graphql-upload'
import {RequireProperties} from '@wepublish/utils/api'

@ObjectType()
export class FocalPoint {
  @Field(type => Float)
  x!: number | null

  @Field(type => Float)
  y!: number | null

  imageId!: string
}

@ObjectType()
export class Image {
  @Field()
  id!: string

  peerId!: string | null

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field(() => String, {nullable: true})
  filename!: string | null

  @Field(() => String, {nullable: true})
  title!: string | null

  @Field(type => String, {nullable: true})
  description!: string | null

  @Field(type => [String])
  tags!: string[]

  @Field(() => String, {nullable: true})
  link!: string | null

  @Field(() => String, {nullable: true})
  source!: string | null

  @Field(() => String, {nullable: true})
  license!: string | null

  @Field(type => Int)
  fileSize!: number

  @Field()
  extension!: string

  @Field()
  mimeType!: string

  @Field(() => String, {nullable: true})
  url?: string

  @Field()
  format!: string

  @Field(type => Int)
  width!: number

  @Field(type => Int)
  height!: number

  @Field(type => FocalPoint, {nullable: true})
  focalPoint?: FocalPoint | null

  @Field(() => String, {nullable: true})
  transformURL?: string
}

export type ImageWithFocalPoint = RequireProperties<Image, 'focalPoint'>

export function isImageWithFocalPoint(image: Image): image is ImageWithFocalPoint {
  return image.focalPoint !== undefined
}

@InputType()
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
