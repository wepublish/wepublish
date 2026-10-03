import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import { Page, PageQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export enum PageType {
  Article = 'Article',
  ArticleList = 'ArticleList',
  ArticleListByTag = 'ArticleListByTag',
  Author = 'Author',
  AuthorList = 'AuthorList',
  Event = 'Event',
  EventList = 'EventList',
  Home = 'Home',
  Profile = 'Profile',
  ProfileList = 'ProfileList',
  SearchResults = 'SearchResults',
  SearchPage = 'SearchPage',
  SubscriptionPage = 'SubscriptionPage',
  Page = 'Page',
  Login = 'Login',
  Unknown = 'Unknown',
}

export type BuilderPageProps = PropsWithChildren<
  Pick<
    useQuery.Result<PageQuery, OperationVariables, 'complete' | 'empty'>,
    'data' | 'loading' | 'error'
  > & {
    className?: string;
  }
>;

export type BuilderPageSEOProps = {
  page: Page;
};
