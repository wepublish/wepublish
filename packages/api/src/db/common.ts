export enum SortOrder {
  Ascending = 1,
  Descending = -1
}

export interface PageInfo {
  startCursor: string | null
  endCursor: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ConnectionResult<T> {
  nodes: T[]
  pageInfo: PageInfo
  totalCount: number
}

export const MaxResultsPerPage = 100

export enum DateFilterComparison {
  GreaterThan = 'gt',
  GreaterThanOrEqual = 'gte',
  Equal = 'eq',
  LowerThan = 'lt',
  LowerThanOrEqual = 'lte'
}
export interface DateFilter {
  date: Date | null
  comparison: DateFilterComparison
}
