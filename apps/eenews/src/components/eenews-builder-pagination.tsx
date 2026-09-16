import { BuilderPaginationProps } from '@wepublish/website/builder';
import { ChangeEvent } from 'react';

import { EenewsPagination } from './eenews-pagination';

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
