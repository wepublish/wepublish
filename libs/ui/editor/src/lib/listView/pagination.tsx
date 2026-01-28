import { Pagination as RsuitePagination } from 'rsuite';

import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';
import { PaginationState } from './paginated-query-container';

type PaginationProps = {
  state: PaginationState;
  totalCount?: number;
};

export function Pagination({ state, totalCount }: PaginationProps) {
  const { limit, setLimit, page, setPage } = state;
  return (
    <RsuitePagination
      limit={limit}
      limitOptions={DEFAULT_TABLE_PAGE_SIZES}
      maxButtons={DEFAULT_MAX_TABLE_PAGES}
      first
      last
      prev
      next
      ellipsis
      boundaryLinks
      layout={['total', '-', 'limit', '|', 'pager', 'skip']}
      total={totalCount ?? 0}
      activePage={page}
      onChangePage={page => setPage(page)}
      onChangeLimit={limit => setLimit(limit)}
    />
  );
}
