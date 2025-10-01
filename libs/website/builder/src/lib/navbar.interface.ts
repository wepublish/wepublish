import { QueryResult } from '@apollo/client';
import { ButtonProps } from '@wepublish/ui';
import { FullImageFragment, NavigationListQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderNavbarProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
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
  }
>;
