import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import { NavigationListQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderFooterProps = PropsWithChildren<
  Pick<
    useQuery.Result<
      NavigationListQuery,
      OperationVariables,
      'complete' | 'empty'
    >,
    'data' | 'loading' | 'error'
  > & {
    className?: string;
    slug: string;
    iconSlug?: string;
    categorySlugs: string[][];
    hideBannerOnIntersecting?: boolean;
    wepublishLogo: 'light' | 'dark' | 'hidden';
  }
>;
