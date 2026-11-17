import { ListMailTemplateFragment, MailChannel } from '@wepublish/editor/api';

/**
 * Filtering, sorting and paging of the template table. It all happens in the
 * browser: the list is the same handful of templates every picker loads, and
 * status and subject are not columns the database could sort by.
 */
export type TemplateRow = ListMailTemplateFragment;

export type TemplateFilter = {
  search?: string;
  purposes?: string[];
  channels?: MailChannel[];
  statuses?: string[];
  layouts?: string[];
  appendices?: string[];
  memberPlans?: string[];
};

export const TEMPLATE_FILTER_FIELDS = [
  'search',
  'purposes',
  'channels',
  'statuses',
  'layouts',
  'appendices',
  'memberPlans',
] as const;

/** Filter value for "letter on the default stationery". */
export const DEFAULT_LAYOUT = '__default';

/** Filter value for "letter without appendix". */
export const NO_APPENDIX = '__none';

const hasLetter = (row: TemplateRow) =>
  row.channels.includes(MailChannel.Letter);

/** The stationery of a row as the filter knows it; null without a letter. */
const layoutOf = (row: TemplateRow) =>
  hasLetter(row) ? (row.letterLayoutName ?? DEFAULT_LAYOUT) : null;

const appendixOf = (row: TemplateRow) =>
  hasLetter(row) ? (row.letterAppendixName ?? NO_APPENDIX) : null;

const picked = <T>(values: T[] | undefined, matches: (value: T) => boolean) =>
  !values?.length || values.some(matches);

export const filterTemplates = (
  rows: TemplateRow[],
  filter: TemplateFilter
): TemplateRow[] => {
  const search = filter.search?.trim().toLowerCase();

  return rows.filter(
    row =>
      (!search ||
        [row.name, row.description, row.subject].some(text =>
          text?.toLowerCase().includes(search)
        )) &&
      picked(filter.purposes, purpose => purpose === row.context) &&
      picked(filter.channels, channel => row.channels.includes(channel)) &&
      picked(filter.statuses, status => status === row.status) &&
      picked(filter.layouts, layout => layout === layoutOf(row)) &&
      picked(filter.appendices, appendix => appendix === appendixOf(row)) &&
      picked(filter.memberPlans, id =>
        row.memberPlans.some(plan => plan.id === id)
      )
  );
};

const byText = (a: string, b: string) =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

const distinct = (values: Array<string | null>, first: string) => {
  const found = new Set(values.filter((value): value is string => !!value));
  const named = [...found].filter(value => value !== first).sort(byText);

  return found.has(first) ? [first, ...named] : named;
};

/** The stationery the filter offers: what the letters in the list use. */
export const layoutOptions = (rows: TemplateRow[]) =>
  distinct(rows.map(layoutOf), DEFAULT_LAYOUT);

export const appendixOptions = (rows: TemplateRow[]) =>
  distinct(rows.map(appendixOf), NO_APPENDIX);

export const memberPlanOptions = (rows: TemplateRow[]) =>
  [
    ...new Map(
      rows.flatMap(row => row.memberPlans).map(plan => [plan.id, plan])
    ).values(),
  ].sort((a, b) => byText(a.name, b.name));

// Templates something sends come first: they are the ones that matter.
const STATUS_ORDER = ['ok', 'unused', 'error'];

export const TEMPLATE_SORT_FIELDS = [
  'name',
  'context',
  'description',
  'subject',
  'status',
  'letterLayoutName',
  'letterAppendixName',
];

const sortValue = (
  row: TemplateRow,
  field: string,
  purposeLabel: (context: string) => string
): string | number | null => {
  switch (field) {
    case 'name':
      return row.name;
    case 'context':
      return row.context ? purposeLabel(row.context) : null;
    case 'description':
      return row.description || null;
    case 'subject':
      return row.subject || null;
    case 'status':
      return STATUS_ORDER.indexOf(row.status);
    case 'letterLayoutName':
      return row.letterLayoutName ?? null;
    case 'letterAppendixName':
      return row.letterAppendixName ?? null;
    default:
      return null;
  }
};

export const sortTemplates = (
  rows: TemplateRow[],
  field: string,
  order: 'asc' | 'desc',
  purposeLabel: (context: string) => string
): TemplateRow[] => {
  if (!TEMPLATE_SORT_FIELDS.includes(field)) {
    return rows;
  }

  const direction = order === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    const left = sortValue(a, field, purposeLabel);
    const right = sortValue(b, field, purposeLabel);

    // Rows without a value stay at the end, whichever way the rest is sorted.
    if (left === null || right === null) {
      return (
        left === right ? byText(a.name, b.name)
        : left === null ? 1
        : -1
      );
    }

    const compared =
      typeof left === 'number' && typeof right === 'number' ?
        left - right
      : byText(String(left), String(right));

    return compared ? compared * direction : byText(a.name, b.name);
  });
};

/** One page of the list; a page beyond the end becomes the last one. */
export const pageOf = <T>(rows: T[], page: number, limit: number) => {
  const last = Math.max(1, Math.ceil(rows.length / limit));
  const current = Math.min(Math.max(1, page), last);

  return {
    page: current,
    rows: rows.slice((current - 1) * limit, current * limit),
  };
};
