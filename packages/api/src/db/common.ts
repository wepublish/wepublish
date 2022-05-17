import {UserInputError} from 'apollo-server-express'

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

export enum InputCursorType {
  After = 'after',
  Before = 'before',
  None = 'none'
}

export type InputCursor =
  | {
      readonly type: InputCursorType.Before | InputCursorType.After
      readonly data: string
    }
  | {
      readonly type: InputCursorType.None
    }

export function InputCursor(after?: string, before?: string): InputCursor {
  if (after && before) {
    throw new UserInputError('You must provide either `after` or `before`.')
  }

  if (!after && !before) {
    return {type: InputCursorType.None}
  }

  return {
    type: after ? InputCursorType.After : InputCursorType.Before,
    data: after || before!
  }
}

export enum LimitType {
  First = 'first',
  Last = 'last'
}

export interface Limit {
  readonly type: LimitType
  readonly count: number
  readonly skip?: number
}

export const MaxResultsPerPage = 100

export function Limit(first?: number, last?: number, skip?: number): Limit {
  if ((first == null && last == null) || (first != null && last != null)) {
    throw new UserInputError('You must provide either `first` or `last`.')
  }
  const count = Math.min(first || last!, MaxResultsPerPage)
  return {
    type: first ? LimitType.First : LimitType.Last,
    count,
    skip: skip ? skip * count : 0
  }
}

export interface MetadataProperty {
  key: string
  value: string
  public: boolean
}

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
