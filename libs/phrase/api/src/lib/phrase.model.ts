import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { ArticleSort, PaginatedArticles } from '@wepublish/article/api';
import { PageSort, PaginatedPages } from '@wepublish/page/api';
import { SortOrder } from '@wepublish/utils/api';

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

@ArgsType()
export class PhraseQueryArgs {
  @Field()
  query!: string;

  @Field(() => Int, { defaultValue: 10 })
  take!: number;

  @Field(() => Int, { defaultValue: 0 })
  skip!: number;

  @Field(() => PageSort, { defaultValue: PageSort.PublishedAt })
  pageSort!: PageSort;

  @Field(() => ArticleSort, { defaultValue: ArticleSort.PublishedAt })
  articleSort!: ArticleSort;

  @Field(() => SortOrder, { defaultValue: SortOrder.Descending })
  order!: SortOrder;
}

@ObjectType()
export class Phrase {
  @Field(() => PaginatedPages)
  pages!: PaginatedPages;

  @Field(() => PaginatedArticles)
  articles!: PaginatedArticles;
}
