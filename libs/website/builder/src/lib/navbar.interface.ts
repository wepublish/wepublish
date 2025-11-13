import { QueryResult } from '@apollo/client';
import { ButtonProps } from '@wepublish/ui';
import { FullImageFragment, NavigationListQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type EssentialPageProps = {
  Page: {
    __typename: string;
    id: string;
    publishedAt: string;
    modifiedAt: string;
    url: string;
    slug: string;
    tags: string[];
    latest: {
      __ref: string;
    };
  };
};

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
    essentialPageProps?: EssentialPageProps;
  }
>;
