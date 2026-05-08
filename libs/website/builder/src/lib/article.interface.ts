import { QueryResult } from '@apollo/client';

import {
  Article,
  ArticleListQuery,
  ArticleListQueryVariables,
  ArticleQuery,
  RelatedArticleListQuery,
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
  article: Article;
};

export type BuilderArticleMetaProps = {
  article: Article;
  className?: string;
};

export type BuilderArticleListProps = Pick<
  QueryResult<ArticleListQuery | RelatedArticleListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string;
  variables?: Partial<ArticleListQueryVariables>;
  onVariablesChange?: (variables: Partial<ArticleListQueryVariables>) => void;
};

export type BuilderArticleDateProps = {
  article: Article;
  className?: string;
};

export type BuilderArticleAuthorsProps = {
  article: Article;
  className?: string;
};
