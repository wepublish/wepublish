import { QueryResult } from '@apollo/client';
import { ArticleRevision, Page, PageQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export enum PageType {
  Article = 'Article',
  ArticleList = 'ArticleList',
  ArticleListByTag = 'ArticleListByTag',
  Author = 'Author',
  AuthorList = 'AuthorList',
  Event = 'Event',
  EventList = 'EventList',
  Profile = 'Profile',
  ProfileList = 'ProfileList',
  SearchResults = 'SearchResults',
  Page = 'Page',
  Unknown = 'Unknown',
}
export type PageTypeBasedProps = {
  Page?: Pick<Page, 'slug' | 'url'>;
  Article?: Pick<ArticleRevision, 'preTitle'>;
  pageType: PageType;
};

export type BuilderPageProps = PropsWithChildren<
  Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
  }
>;

export type BuilderPageSEOProps = {
  page: Page;
};
