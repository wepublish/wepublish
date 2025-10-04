import { registerEnumType } from '@nestjs/graphql';

export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

registerEnumType(SortOrder, { name: 'SortOrder' });

export const graphQLSortOrderToPrisma = (sortOrder: SortOrder) =>
  sortOrder === SortOrder.Ascending ? 'asc' : 'desc';
