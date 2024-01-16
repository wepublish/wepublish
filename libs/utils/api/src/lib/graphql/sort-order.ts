export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending'
}

export const graphQLSortOrderToPrisma = (sortOrder: SortOrder) =>
  sortOrder === SortOrder.Ascending ? 'asc' : 'desc'
