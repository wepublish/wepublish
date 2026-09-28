import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';

import {
  ArticleListQuery,
  ArticleListQueryVariables,
  Tag,
  TagQuery,
} from '@wepublish/website/api';

export type BuilderTagProps = {
  className?: string;
  tag: Pick<
    useQuery.Result<TagQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  articles: Pick<
    useQuery.Result<ArticleListQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  >;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderTagSEOProps = {
  tag: Tag;
};
