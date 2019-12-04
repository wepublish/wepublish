export interface PageInfo {
  startCursor: string | null
  endCursor: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface Pagination {
  after?: string
  before?: string
  first?: number
  last?: number
}
