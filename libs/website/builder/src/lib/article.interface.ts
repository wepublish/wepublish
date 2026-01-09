import { QueryResult } from '@apollo/client';

import {
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
  FullArticleFragment,
} from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderArticleProps = PropsWithChildren<
  Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
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
  QueryResult<ArticleListQuery>,
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
