export interface PageInfo {
  readonly startCursor?: string
  readonly endCursor?: string
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}
