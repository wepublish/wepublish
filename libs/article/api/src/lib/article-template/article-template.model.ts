import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BlockContentInput, BlockTemplate } from '@wepublish/block-content/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import {
  ArticleTemplateMetadata,
  ArticleTemplateMetadataInput,
} from '../article.model';

@ObjectType()
export class ArticleTemplate {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  blockTemplateId!: string;

  @Field(() => BlockTemplate, {
    description: 'The content (name and blocks) of the article template.',
  })
  blockTemplate?: BlockTemplate;

  @Field(() => ArticleTemplateMetadata)
  metadata!: ArticleTemplateMetadataInput;
}

@ObjectType()
export class PaginatedArticleTemplate extends PaginatedType(ArticleTemplate) {}

@InputType()
export class ArticleTemplateFilter {
  @Field({ nullable: true })
  name?: string;
}

export enum ArticleTemplateSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

registerEnumType(ArticleTemplateSort, {
  name: 'ArticleTemplateSort',
});

@ArgsType()
export class ArticleTemplateListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => ArticleTemplateFilter, { nullable: true })
  filter?: ArticleTemplateFilter;

  @Field(() => ArticleTemplateSort, {
    defaultValue: ArticleTemplateSort.Name,
  })
  sort?: ArticleTemplateSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Ascending,
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreateArticleTemplateInput {
  @Field()
  name!: string;

  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[];

  @Field(() => ArticleTemplateMetadataInput)
  metadata!: ArticleTemplateMetadataInput;
}

@ArgsType()
export class UpdateArticleTemplateInput extends CreateArticleTemplateInput {
  @Field()
  id!: string;
}
