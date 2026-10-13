import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import { PrimaryBannerQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderBannerProps = PropsWithChildren<
  Pick<
    useQuery.Result<
      PrimaryBannerQuery,
      OperationVariables,
      'complete' | 'empty'
    >,
    'data' | 'loading' | 'error'
  > & {
    className?: string;
    tags?: string[];
  }
>;
