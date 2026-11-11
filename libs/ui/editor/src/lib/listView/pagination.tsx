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
  compact?: boolean;
  className?: string;
  label?: string;
};

export function Pagination({
  state,
  totalCount,
  compact,
  className,
  label,
}: PaginationProps) {
  const { limit, setLimit, page, setPage } = state;
  const { t } = useTranslation();
  const sizeLabelId = useId();

  const total = totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'space-between',
        gap: compact ? 0 : 2,
        width: '100%',
        marginTop: compact ? 0 : 'auto',
        paddingTop: compact ? 0 : 2,
      }}
    >
      {!compact && (
        <Typography
          variant="body2"
          color="text.secondary"
          role="status"
          aria-atomic
        >
          {t('listView.pagination.total', { count: total })}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {!compact && (
          <Box
            component="label"
            htmlFor={sizeLabelId}
            sx={{ display: 'none' }}
          >
            {t('listView.pagination.pageSize')}
          </Box>
        )}

        {!compact && (
          <Select
            native
            size="small"
            id={sizeLabelId}
            inputProps={{ 'aria-label': t('listView.pagination.pageSize') }}
            sx={{
              '& .MuiSelect-select': {
                paddingBlock: 0.5,
                fontSize: theme => theme.typography.body2.fontSize,
              },
            }}
            value={limit}
            onChange={event => {
              setLimit(Number(event.target.value));
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
        )}

        <MuiPagination
          aria-label={label ?? t('listView.pagination.label')}
          shape="rounded"
          size={compact ? 'small' : 'medium'}
          count={pageCount}
          page={page}
          siblingCount={Math.max(
            0,
            Math.floor((DEFAULT_MAX_TABLE_PAGES - 4) / 2)
          )}
          boundaryCount={compact ? 0 : 1}
          showFirstButton={!compact}
          showLastButton={!compact}
          onChange={(_event, next) => setPage(next)}
          getItemAriaLabel={(type, item, selected) => {
            switch (type) {
              case 'first':
                return t('listView.pagination.first');
              case 'last':
                return t('listView.pagination.last');
              case 'next':
                return t('listView.pagination.next');
              case 'previous':
                return t('listView.pagination.previous');
              default:
                return selected ?
                    t('listView.pagination.currentPage', { page: item })
                  : t('listView.pagination.page', { page: item });
            }
          }}
        />
      </Box>
    </Box>
  );
}

export { MenuItem as PaginationMenuItem };
