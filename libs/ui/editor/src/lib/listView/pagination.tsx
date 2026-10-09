import {
  Box,
  MenuItem,
  Pagination as MuiPagination,
  Select,
  Typography,
} from '@mui/material';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES } from '../utility';
import { PaginationState } from './paginated-query-container';

type PaginationProps = {
  state: PaginationState;
  totalCount?: number;
};

/**
 * Page size, numbered pager and total count for the list views.
 *
 * MUI's `TablePagination` only offers prev/next arrows, which is awkward on
 * lists that run to a hundred-plus pages, so this composes MUI's numbered
 * `Pagination` with a page-size `Select` instead.
 */
export function Pagination({ state, totalCount }: PaginationProps) {
  const { limit, setLimit, page, setPage } = state;
  const { t } = useTranslation();
  const sizeLabelId = useId();

  const total = totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        width: '100%',
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {t('listView.pagination.total', { count: total })}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          component="label"
          htmlFor={sizeLabelId}
          sx={{ display: 'none' }}
        >
          {t('listView.pagination.pageSize')}
        </Box>

        <Select
          native
          size="small"
          id={sizeLabelId}
          inputProps={{ 'aria-label': t('listView.pagination.pageSize') }}
          value={limit}
          onChange={event => {
            setLimit(Number(event.target.value));
            // The old page may not exist at the new size.
            setPage(1);
          }}
        >
          {DEFAULT_TABLE_PAGE_SIZES.map(size => (
            <option
              key={size}
              value={size}
            >
              {t('listView.pagination.perPage', { count: size })}
            </option>
          ))}
        </Select>

        <MuiPagination
          shape="rounded"
          count={pageCount}
          page={page}
          // Mirrors rsuite's `maxButtons`, which counted the whole strip.
          siblingCount={Math.max(
            0,
            Math.floor((DEFAULT_MAX_TABLE_PAGES - 4) / 2)
          )}
          boundaryCount={1}
          showFirstButton
          showLastButton
          onChange={(_event, next) => setPage(next)}
        />
      </Box>
    </Box>
  );
}

/** Re-exported so call sites can build a bare page-size picker if needed. */
export { MenuItem as PaginationMenuItem };
