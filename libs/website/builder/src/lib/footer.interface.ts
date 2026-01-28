import { QueryResult } from '@apollo/client';
import { NavigationListQuery } from '@wepublish/website/api';
import { PropsWithChildren } from 'react';

export type BuilderFooterProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
    slug: string;
    iconSlug?: string;
    categorySlugs: string[][];
    hideBannerOnIntersecting?: boolean;
    wepublishLogo: 'light' | 'dark' | 'hidden';
  }
>;
