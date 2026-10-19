import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { SortOrder, PaginatedType } from '@wepublish/utils/api';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

export enum VideoSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(VideoSort, {
  name: 'VideoSort',
});

@ObjectType()
export class Video {
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

  @Field({ nullable: true })
  description?: string;

  @Field()
  mimeType!: string;

  @Field(type => Int)
  fileSize!: number;

  @Field()
  extension!: string;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => Int, { nullable: true })
  height?: number;

  @Field(() => Float, {
    nullable: true,
    description: `Length in seconds, as the browser reported it on upload.`,
  })
  duration?: number;

  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  link?: string;

  @Field(() => String, { nullable: true })
  license?: string;

  @Field(() => Boolean)
  hasPoster!: boolean;

  @Field(() => String, { nullable: true })
  posterUrl?: string;

  @Field(() => String)
  url!: string;
}

@ObjectType()
export class PaginatedVideos extends PaginatedType(Video) {}

@ObjectType()
export class VideoStorageUsage {
  @Field(type => Float)
  usedBytes!: number;

  @Field(type => Float)
  limitBytes!: number;

  @Field(type => Int)
  videoCount!: number;
}

@InputType()
export class VideoFilter {
  @Field({ nullable: true })
  title?: string;
}

@ArgsType()
export class VideoListArgs {
  @Field(type => VideoFilter, { nullable: true })
  filter?: VideoFilter;

  @Field(type => VideoSort, {
    nullable: true,
    defaultValue: VideoSort.ModifiedAt,
  })
  sort?: VideoSort;

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

@ArgsType()
export class UploadVideoInput extends PickType(
  Video,
  [
    'filename',
    'title',
    'description',
    'source',
    'link',
    'license',
    'width',
    'height',
    'duration',
  ] as const,
  ArgsType
) {
  @Field(() => GraphQLUpload)
  file!: Promise<FileUpload>;

  @Field(() => GraphQLUpload, {
    nullable: true,
    description: `A frame grabbed from the video in the browser, used as its thumbnail.`,
  })
  poster?: Promise<FileUpload>;
}

@ArgsType()
export class UpdateVideoInput extends PartialType(
  PickType(
    Video,
    ['title', 'description', 'source', 'link', 'license'] as const,
    ArgsType
  ),
  ArgsType
) {
  @Field()
  id!: string;
}
