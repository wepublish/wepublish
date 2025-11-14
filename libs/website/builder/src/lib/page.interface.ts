import { QueryResult } from '@apollo/client';
import { Page, ArticleRevision, PageQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type EssentialPageProps = {
  Page?: Pick<Page, 'slug' | 'url'>;
  Article?: Pick<ArticleRevision, 'preTitle'>;
  pageType: string;
};

export type BuilderPageProps = PropsWithChildren<
  Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
  }
>;

export type BuilderPageSEOProps = {
  page: Page;
};
