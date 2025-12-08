import { QueryResult } from '@apollo/client';

import {
  ArticleListQuery,
  ArticleListQueryVariables,
  Tag,
  TagQuery,
} from '@wepublish/website/api';
import { CSSProperties } from 'react';

export type BuilderTagProps = {
  className?: string;
  style?: CSSProperties;
  tags: Pick<QueryResult<TagQuery>, 'data' | 'loading' | 'error'>;
  articles: Pick<QueryResult<ArticleListQuery>, 'data' | 'loading' | 'error'>;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderTagSEOProps = {
  tag: Tag;
};
