import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { SortOrder, PaginatedType } from '@wepublish/utils/api';
import { FileUpload, GraphQLUpload } from 'graphql-upload';

export enum DocumentSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(DocumentSort, {
  name: 'DocumentSort',
});

@ObjectType()
export class Document {
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

  @Field(() => String)
  url!: string;

  @Field(() => String, { nullable: true })
  thumbnailURL?: string;
}

@ObjectType()
export class PaginatedDocuments extends PaginatedType(Document) {}

@InputType()
export class DocumentFilter {
  @Field({ nullable: true })
  title?: string;
}

@ArgsType()
export class DocumentListArgs {
  @Field(type => DocumentFilter, { nullable: true })
  filter?: DocumentFilter;

  @Field(type => DocumentSort, {
    nullable: true,
    defaultValue: DocumentSort.ModifiedAt,
  })
  sort?: DocumentSort;

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
export class UploadDocumentInput extends PickType(
  Document,
  ['filename', 'title', 'description'] as const,
  ArgsType
) {
  @Field(() => GraphQLUpload)
  file!: Promise<FileUpload>;
}

@ArgsType()
export class UpdateDocumentInput extends PartialType(
  PickType(Document, ['title', 'description'] as const, ArgsType),
  ArgsType
) {
  @Field()
  id!: string;
}
