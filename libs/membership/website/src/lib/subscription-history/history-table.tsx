import styled from '@emotion/styled';
import { Table, TableCell } from '@mui/material';

/** Columns of the subscription history: the expand arrow, the plan and six
 * values. */
export const HISTORY_COLUMNS = 8;

/**
 * Below this container width the rows stack: the table with its invoices open
 * needs about this much room for its nine columns and unwrapped dates.
 */
export const HISTORY_STACKED_MAX_WIDTH = 1150; // px

/** Container queries for the stacked layout and for the table columns. */
export const HISTORY_STACKED = `@container (max-width: ${HISTORY_STACKED_MAX_WIDTH}px)`;
export const HISTORY_COLUMNS_SHOWN = `@container (min-width: ${HISTORY_STACKED_MAX_WIDTH + 1}px)`;

/** Container the tables measure themselves against. */
export const HistoryTableWrapper = styled('div')`
  container-type: inline-size;
  width: 100%;
`;

/**
 * A table on wide containers. On narrow ones every row becomes a block and
 * every cell shows its column label (`data-label`) in front of its value.
 */
export const HistoryTable = styled(Table)`
  // the website's global styles frame every table cell (meant for article
  // tables); this table only separates its rows
  &,
  & td,
  & th {
    border: none;
  }

  & td,
  & th {
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  }

  & time {
    white-space: nowrap;
  }

  & thead th {
    background-color: ${({ theme }) => theme.palette.grey[100]};
    font-weight: 600;
    white-space: nowrap;
    hyphens: manual;
  }

  ${HISTORY_STACKED} {
    &,
    thead,
    tbody,
    tr,
    th,
    td {
      display: block;
    }

    thead tr {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    tr {
      border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
      padding: ${({ theme }) => theme.spacing(1, 0)};
    }

    td {
      display: grid;
      grid-template-columns: 40% 1fr;
      gap: ${({ theme }) => theme.spacing(1)};
      border: none;
      padding: ${({ theme }) => theme.spacing(0.5, 1)};
    }

    td[data-label]::before {
      content: attr(data-label);
      font-weight: 600;
    }

    td[data-label='']::before {
      content: none;
    }

    td[data-label=''] {
      grid-template-columns: 1fr;
    }
  }
`;

export const HistoryCell = styled(TableCell)`
  vertical-align: top;
`;

/** The arrow column: as narrow as its arrows, on both levels. */
export const HistoryArrowCell = styled(HistoryCell)`
  padding-right: 0;
`;

/**
 * The plan column has a little more room on the left; the invoice column
 * below it uses the same, so subscription and invoice labels line up.
 */
export const PLAN_PADDING = 2.5; // theme spacing units

/**
 * The plan column keeps its width when invoices open below it: their labels
 * are longer than the plan names and are cut short instead (narrow layouts
 * stack the cells anyway).
 */
export const PLAN_COLUMN_WIDTH = '12.5rem';

export const HistoryPlanCell = styled(HistoryCell)`
  padding-left: ${({ theme }) => theme.spacing(PLAN_PADDING)};

  ${HISTORY_COLUMNS_SHOWN} {
    width: ${PLAN_COLUMN_WIDTH};
  }
`;

/**
 * The status column keeps its width too: the invoices' icons and labels are
 * wider than the subscriptions' chips.
 */
export const STATE_COLUMN_WIDTH = '9rem';

export const HistoryStateCell = styled(HistoryCell)`
  ${HISTORY_COLUMNS_SHOWN} {
    width: ${STATE_COLUMN_WIDTH};
  }
`;

export const HistoryAmount = styled('span')`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const HistoryState = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;
