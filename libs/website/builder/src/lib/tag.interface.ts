import { QueryResult } from '@apollo/client';

import {
  ArticleListQuery,
  ArticleListQueryVariables,
  Tag,
  TagQuery,
} from '@wepublish/website/api';

export type BuilderTagProps = {
  className?: string;
  tag: Pick<QueryResult<TagQuery>, 'data' | 'loading' | 'error'>;
  articles: Pick<QueryResult<ArticleListQuery>, 'data' | 'loading' | 'error'>;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderTagSEOProps = {
  tag: Tag;
};
