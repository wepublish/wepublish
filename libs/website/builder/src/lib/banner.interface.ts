import { QueryResult } from '@apollo/client';
import { PrimaryBannerQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderBannerProps = PropsWithChildren<
  Pick<QueryResult<PrimaryBannerQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
  }
>;
