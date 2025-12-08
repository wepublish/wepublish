import { QueryResult } from '@apollo/client';
import { NavigationListQuery } from '@wepublish/website/api';
import { CSSProperties, PropsWithChildren } from 'react';

export type BuilderFooterProps = PropsWithChildren<
  Pick<QueryResult<NavigationListQuery>, 'data' | 'loading' | 'error'> & {
    className?: string;
    style?: CSSProperties;
    slug: string;
    iconSlug?: string;
    categorySlugs: string[][];
    hideBannerOnIntersecting?: boolean;
    wepublishLogo: 'light' | 'dark' | 'hidden';
  }
>;
