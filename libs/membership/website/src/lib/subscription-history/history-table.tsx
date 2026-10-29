import styled from '@emotion/styled';
import { Table, TableCell, Theme } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { format } from 'date-fns';

/** Columns of the subscription history: the expand arrow, the plan and six
 * values. */
export const HISTORY_COLUMNS = 8;

/**
 * The least each column of the table needs, padding included, in px: arrow,
 * plan, state, start, paid until, amount, payment method, renewal (measured
 * with the longest values). With short dates (07.10.2026) and with long ones
 * (28. September 2026, the widest month). Each set adds up to the narrowest table it is used for;
 * a wider table shares the rest among the columns in the same proportion.
 */
export const HISTORY_COLUMN_MIN_WIDTHS = {
  shortDates: [44, 144, 103, 90, 90, 143, 141, 110],
  longDates: [44, 200, 144, 150, 150, 143, 141, 110],
};

const sum = (widths: number[]) => widths.reduce((a, b) => a + b, 0);

/** Below this container width the rows stack: the table would not fit. */
export const HISTORY_STACKED_MAX_WIDTH =
  sum(HISTORY_COLUMN_MIN_WIDTHS.shortDates) - 1; // 864px

/** Up to this container width, the table shows its dates short. */
export const HISTORY_SHORT_DATES_MAX_WIDTH =
  sum(HISTORY_COLUMN_MIN_WIDTHS.longDates) - 1; // 1081px

/**
 * The widths of the table's columns, from its header cells: each column's
 * share of the table is its share of the least the columns need together.
 */
export const historyColumnWidths = (widths: number[]) =>
  widths
    .map(
      (width, index) => `
        thead th:nth-of-type(${index + 1}) {
          width: ${((width / sum(widths)) * 100).toFixed(3)}%;
        }
      `
    )
    .join('');

/** Container queries for the stacked layout and for the table columns. */
export const HISTORY_STACKED = `@container (max-width: ${HISTORY_STACKED_MAX_WIDTH}px)`;
export const HISTORY_COLUMNS_SHOWN = `@container (min-width: ${HISTORY_STACKED_MAX_WIDTH + 1}px)`;
export const HISTORY_SHORT_DATES = `@container (min-width: ${HISTORY_STACKED_MAX_WIDTH + 1}px) and (max-width: ${HISTORY_SHORT_DATES_MAX_WIDTH}px)`;
export const HISTORY_LONG_DATES = `@container (min-width: ${HISTORY_SHORT_DATES_MAX_WIDTH + 1}px)`;

/**
 * From this container width up to the table, a stacked row shows its values
 * in two halves side by side instead of one below the other.
 */
export const HISTORY_HALVES_MIN_WIDTH = 680; // px
export const HISTORY_HALVES = `@container (min-width: ${HISTORY_HALVES_MIN_WIDTH}px) and (max-width: ${HISTORY_STACKED_MAX_WIDTH}px)`;

type HistoryHalvesOptions = {
  /** How many label-value pairs each half has. */
  pairs: number;
  /** The cell across the row on top, its value as wide as the rest. */
  top: string;
  /** The cell across the row at the bottom, if any. */
  bottom?: string;
  /** The cells of the right half; the others fill the left one first. */
  right: string;
};

/**
 * A stacked row in two equal halves (HISTORY_HALVES), the divider between
 * them in the middle of the row. Each half gives its labels the same width in
 * every row, so the labels line up across the lines and rows.
 */
export const historyHalves = (
  theme: Theme,
  { pairs, top, bottom, right }: HistoryHalvesOptions
) => `
  ${HISTORY_HALVES} {
    && {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto repeat(${pairs}, auto) ${bottom ? 'auto' : ''};
      grid-auto-flow: column;
    }

    // wider only for longer labels
    && > td {
      grid-template-columns: minmax(max-content, 6.5rem) 1fr;
      padding-right: ${theme.spacing(3)};
    }

    && > :is(${top}${bottom ? `, ${bottom}` : ''}) {
      grid-column: 1 / -1;
      padding-right: ${theme.spacing(PLAN_PADDING)};
    }

    && > :is(${top}) {
      grid-row: 1;
    }

    ${bottom ? `&& > :is(${bottom}) { grid-row: -2; }` : ''}

    && > :is(${right}) {
      grid-template-columns: minmax(max-content, 10rem) 1fr;
      border-left: 1px solid ${theme.palette.divider};
      padding-left: ${theme.spacing(3)};
      padding-right: ${theme.spacing(PLAN_PADDING)};
    }

    && > td[data-label=''] {
      grid-template-columns: 1fr;
    }
  }
`;

/**
 * The plan column has a little more room on the left; the invoice column
 * below it uses the same, so subscription and invoice labels line up.
 */
export const PLAN_PADDING = 2.5; // theme spacing units

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
  // dates: long, except in the narrowest tables
  [data-date='short'] {
    display: none;
  }

  ${HISTORY_SHORT_DATES} {
    [data-date='long'] {
      display: none;
    }

    [data-date='short'] {
      display: inline;
    }
  }

  // a closed subscription's invoices: hidden in the table, shown when stacked.
  // Collapsed, not removed, so they keep their share of the column widths and
  // opening them moves no column; rows only the stacked layout needs are gone.
  ${HISTORY_COLUMNS_SHOWN} {
    tr[data-collapsed='true'] {
      visibility: collapse;
    }

    tr[data-stacked-only='true'] {
      display: none;
    }
  }

  // invoices past the stacked layout's limit, until the reader asks for all
  ${HISTORY_STACKED} {
    tr[data-beyond-limit='true'] {
      display: none;
    }
  }

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

  // the forms inside too: a website's styles can reset spans
  & time,
  & [data-date] {
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
      padding: ${({ theme }) => theme.spacing(0.5, PLAN_PADDING)};
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

  // narrower than MUI's default, so the table needs less room
  ${HISTORY_COLUMNS_SHOWN} {
    padding-left: ${({ theme }) => theme.spacing(1)};
    padding-right: ${({ theme }) => theme.spacing(1)};
  }
`;

/** The arrow column: as narrow as its arrows, on both levels. */
export const HistoryArrowCell = styled(HistoryCell)`
  padding-right: 0;
`;

/**
 * The plan column. Its width comes from the table (`historyColumnWidths`);
 * the invoices' labels below it are longer than the plan names and are cut
 * short instead of widening it.
 */
export const HistoryPlanCell = styled(HistoryCell)`
  padding-left: ${({ theme }) => theme.spacing(PLAN_PADDING)};

  // again in the query, or the narrower padding of the table's cells wins
  ${HISTORY_COLUMNS_SHOWN} {
    padding-left: ${({ theme }) => theme.spacing(PLAN_PADDING)};
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
  // a state is one word or chip; never broken across lines
  white-space: nowrap;
  hyphens: manual;
`;

/**
 * A date of the history, in both forms: the table shows the short one only
 * where it is narrow (HISTORY_SHORT_DATES), elsewhere the long one.
 */
export function HistoryDate({ date: value }: { date: string }) {
  const { date } = useWebsiteBuilder();
  const day = new Date(value);

  return (
    <time
      dateTime={value}
      suppressHydrationWarning
    >
      <span
        data-date="long"
        suppressHydrationWarning
      >
        {date.format(day, false)}
      </span>
      <span
        data-date="short"
        suppressHydrationWarning
      >
        {format(day, 'dd.MM.yyyy')}
      </span>
    </time>
  );
}
