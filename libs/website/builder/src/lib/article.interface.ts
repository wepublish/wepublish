import { QueryResult } from '@apollo/client';

import {
  Article,
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
} from '@wepublish/website/api';
import { CSSProperties, PropsWithChildren } from 'react';

export type BuilderArticleProps = PropsWithChildren<
  Pick<QueryResult<ArticleQuery>, 'data' | 'loading' | 'error'> & {
    showPaywall: boolean;
    hideContent: boolean;
    className?: string;
    style?: CSSProperties;
  }
>;

export type BuilderArticleSEOProps = {
  article: Article;
};

export type BuilderArticleMetaProps = {
  article: Article;
  className?: string;
  style?: CSSProperties;
};

export type BuilderArticleListProps = Pick<
  QueryResult<ArticleListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  style?: CSSProperties;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderArticleDateProps = {
  article: Article;
  className?: string;
  style?: CSSProperties;
};

export type BuilderArticleAuthorsProps = {
  article: Article;
  className?: string;
  style?: CSSProperties;
};
