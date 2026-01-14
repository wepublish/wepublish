import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { HasOptionalPeerLc } from '@wepublish/peering/api';
import { SortOrder, PaginatedType } from '@wepublish/utils/api';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

export enum ImageSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

registerEnumType(ImageSort, {
  name: 'ImageSort',
});

@ObjectType()
export class FocalPoint {
  @Field(type => Float)
  x!: number;

  @Field(type => Float)
  y!: number;
}

@InputType()
export class FocalPointInput extends OmitType(
  FocalPoint,
  [] as const,
  InputType
) {}

@ObjectType({
  implements: () => [HasOptionalPeerLc],
})
export class Image extends HasOptionalPeerLc {
  @Field()
  id!: string;
  @Field()
  createdAt!: Date;
  @Field()
  modifiedAt!: Date;

  @Field(() => String, { nullable: true })
  filename?: string;
  @Field(() => String, { nullable: true })
  title?: string;
  @Field(type => String, { nullable: true })
  description?: string;
  @Field(() => String, { nullable: true })
  link?: string;
  @Field(() => String, { nullable: true })
  source?: string;
  @Field(() => String, { nullable: true })
  license?: string;
  @Field(type => FocalPoint, { nullable: true })
  focalPoint?: FocalPoint;

  @Field(type => Int)
  fileSize!: number;
  @Field()
  extension!: string;
  @Field()
  mimeType!: string;
  @Field()
  format!: string;
  @Field(type => Int)
  width!: number;
  @Field(type => Int)
  height!: number;
  @Field(type => [String])
  tags!: string[];

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  transformURL?: string;
}

@ObjectType()
export class PaginatedImages extends PaginatedType(Image) {}

@InputType()
export class ImageFilter {
  @Field({ nullable: true })
  title?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}

@ArgsType()
export class ImageListArgs {
  @Field(type => ImageFilter, { nullable: true })
  filter?: ImageFilter;

  @Field(type => ImageSort, {
    nullable: true,
    defaultValue: ImageSort.ModifiedAt,
  })
  sort?: ImageSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Descending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ObjectType()
export class PeerImage extends OmitType(
  Image,
  ['transformURL'] as const,
  ObjectType
) {
  @Field({ nullable: true })
  xxl?: string;
  @Field({ nullable: true })
  xl?: string;
  @Field({ nullable: true })
  l?: string;
  @Field({ nullable: true })
  m?: string;
  @Field({ nullable: true })
  s?: string;
  @Field({ nullable: true })
  xs?: string;
  @Field({ nullable: true })
  xxs?: string;

  @Field({ nullable: true })
  xxlSquare?: string;
  @Field({ nullable: true })
  xlSquare?: string;
  @Field({ nullable: true })
  lSquare?: string;
  @Field({ nullable: true })
  mSquare?: string;
  @Field({ nullable: true })
  sSquare?: string;
  @Field({ nullable: true })
  xsSquare?: string;
  @Field({ nullable: true })
  xxsSquare?: string;
}

@ArgsType()
export class UploadImageInput extends PickType(
  Image,
  [
    'filename',
    'title',
    'description',
    'tags',
    'link',
    'source',
    'license',
  ] as const,
  ArgsType
) {
  @Field(() => GraphQLUpload)
  file!: Promise<FileUpload>;

  @Field(() => FocalPointInput, { nullable: true })
  focalPoint?: FocalPointInput;
}

@ArgsType()
export class UpdateImageInput extends PartialType(
  OmitType(UploadImageInput, ['file'] as const),
  ArgsType
) {
  @Field()
  id!: string;
}
