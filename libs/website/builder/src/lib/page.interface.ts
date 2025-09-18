import { QueryResult } from '@apollo/client';
import { Page, PageQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderPageProps = PropsWithChildren<
  Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
  }
>;

export type BuilderPageSEOProps = {
  page: Page;
};
