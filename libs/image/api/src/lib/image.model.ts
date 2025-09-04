import {Field, Float, InputType, Int, ObjectType, OmitType} from '@nestjs/graphql'
import {FileUpload, GraphQLUpload} from 'graphql-upload'

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

@ObjectType()
export class PeerImage extends OmitType(Image, ['transformURL'] as const, ObjectType) {
  @Field({nullable: true})
  xxl?: string
  @Field({nullable: true})
  xl?: string
  @Field({nullable: true})
  l?: string
  @Field({nullable: true})
  m?: string
  @Field({nullable: true})
  s?: string
  @Field({nullable: true})
  xs?: string
  @Field({nullable: true})
  xxs?: string

  @Field({nullable: true})
  xxlSquare?: string
  @Field({nullable: true})
  xlSquare?: string
  @Field({nullable: true})
  lSquare?: string
  @Field({nullable: true})
  mSquare?: string
  @Field({nullable: true})
  sSquare?: string
  @Field({nullable: true})
  xsSquare?: string
  @Field({nullable: true})
  xxsSquare?: string
}
