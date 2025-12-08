import { QueryResult } from '@apollo/client';
import { Page, PageQuery } from '@wepublish/website/api';
import { CSSProperties, PropsWithChildren } from 'react';

export type BuilderPageProps = PropsWithChildren<
  Pick<QueryResult<PageQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
    style?: CSSProperties;
  }
>;

export type BuilderPageSEOProps = {
  page: Page;
};
