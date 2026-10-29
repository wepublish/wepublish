import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';

import {
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
  FullArticleFragment,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderArticleProps = PropsWithChildren<
  Pick<
    useQuery.Result<ArticleQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  > & {
    showPaywall: boolean;
    hideContent: boolean;
    className?: string;
  }
>;

export type BuilderArticleSEOProps = {
  article: FullArticleFragment;
};

export type BuilderArticleMetaProps = {
  article: FullArticleFragment;
  className?: string;
};

export type BuilderArticleListProps = Pick<
  useQuery.Result<ArticleListQuery, OperationVariables, 'complete' | 'empty'>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderArticleDateProps = {
  article: FullArticleFragment;
  className?: string;
};

export type BuilderArticleAuthorsProps = {
  article: FullArticleFragment;
  className?: string;
};
