import {PageInfo} from '../adapter/pageInfo'

export enum SortOrder {
  Ascending = 1,
  Descending = -1
}

// TODO: Replace all results with this
export interface ConnectionResult<T> {
  readonly nodes: T[]
  readonly pageInfo: PageInfo
  readonly totalCount: number
}
