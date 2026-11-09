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

export enum AudioSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(AudioSort, {
  name: 'AudioSort',
});

@ObjectType()
export class Audio {
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

  @Field(() => String)
  url!: string;
}

@ObjectType()
export class PaginatedAudios extends PaginatedType(Audio) {}

@ObjectType()
export class AudioStorageUsage {
  @Field(type => Float)
  usedBytes!: number;

  @Field(type => Float)
  limitBytes!: number;

  @Field(type => Int)
  audioCount!: number;
}

@InputType()
export class AudioFilter {
  @Field({ nullable: true })
  title?: string;
}

@ArgsType()
export class AudioListArgs {
  @Field(type => AudioFilter, { nullable: true })
  filter?: AudioFilter;

  @Field(type => AudioSort, {
    nullable: true,
    defaultValue: AudioSort.ModifiedAt,
  })
  sort?: AudioSort;

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
export class UploadAudioInput extends PickType(
  Audio,
  [
    'filename',
    'title',
    'description',
    'source',
    'link',
    'license',
    'duration',
  ] as const,
  ArgsType
) {
  @Field(() => GraphQLUpload)
  file!: Promise<FileUpload>;
}

@ArgsType()
export class UpdateAudioInput extends PartialType(
  PickType(
    Audio,
    ['title', 'description', 'source', 'link', 'license'] as const,
    ArgsType
  ),
  ArgsType
) {
  @Field()
  id!: string;
}
