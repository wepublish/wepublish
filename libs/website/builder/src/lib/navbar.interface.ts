import type { OperationVariables } from '@apollo/client';
import type { useQuery } from '@apollo/client/react';
import { ButtonProps } from '@wepublish/ui';
import { FullImageFragment, NavigationListQuery } from '@wepublish/website/api';
import { PropsWithChildren, ReactNode } from 'react';

export type BuilderNavbarProps = PropsWithChildren<
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
    headerSlug: string;
    categorySlugs: string[][];
    logo?: FullImageFragment | null;
    loginBtn?: ButtonProps | null;
    profileBtn?: ButtonProps | null;
    subscribeBtn?: ButtonProps | null;
    hasUnpaidInvoices: boolean;
    hasRunningSubscription: boolean;
    navbarActions?: ReactNode;
    paperActions?: ReactNode;
  }
>;
