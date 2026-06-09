import { BuilderPaginationProps } from '@wepublish/website/builder';
import { ChangeEvent } from 'react';

import { EenewsPagination } from './eenews-pagination';

// Adapter so the website-builder `Pagination` element (MUI PaginationProps) renders
// the eenews pagination used across the site (e.g. on the search results page).
// Registered in _app's `elements`.
export const EenewsBuilderPagination = ({
  page,
  count,
  onChange,
  className,
}: BuilderPaginationProps) => (
  <EenewsPagination
    page={page ?? 1}
    totalPages={count ?? 1}
    onChange={nextPage => onChange?.({} as ChangeEvent<unknown>, nextPage)}
    className={className}
  />
);
