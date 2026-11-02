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
import { PageTemplateMetadata, PageTemplateMetadataInput } from '../page.model';

@ObjectType()
export class PageTemplate {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  blockTemplateId!: string;

  @Field(() => BlockTemplate, {
    description: 'The content (name and blocks) of the page template.',
  })
  blockTemplate?: BlockTemplate;

  @Field(() => PageTemplateMetadata)
  metadata!: PageTemplateMetadataInput;
}

@ObjectType()
export class PaginatedPageTemplate extends PaginatedType(PageTemplate) {}

@InputType()
export class PageTemplateFilter {
  @Field({ nullable: true })
  name?: string;
}

export enum PageTemplateSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

registerEnumType(PageTemplateSort, {
  name: 'PageTemplateSort',
});

@ArgsType()
export class PageTemplateListArgs {
  @Field(() => String, { nullable: true, description: 'Cursor for pagination' })
  cursorId?: string;

  @Field(() => Int, {
    defaultValue: 10,
    description: 'Number of items to fetch',
  })
  take?: number;

  @Field(() => Int, { defaultValue: 0, description: 'Number of items to skip' })
  skip?: number;

  @Field(() => PageTemplateFilter, { nullable: true })
  filter?: PageTemplateFilter;

  @Field(() => PageTemplateSort, {
    defaultValue: PageTemplateSort.Name,
  })
  sort?: PageTemplateSort;

  @Field(() => SortOrder, {
    defaultValue: SortOrder.Ascending,
    nullable: true,
  })
  order?: SortOrder;
}

@ArgsType()
export class CreatePageTemplateInput {
  @Field()
  name!: string;

  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[];

  @Field(() => PageTemplateMetadataInput)
  metadata!: PageTemplateMetadataInput;
}

@ArgsType()
export class UpdatePageTemplateInput extends CreatePageTemplateInput {
  @Field()
  id!: string;
}
