import { ApolloClient } from '@apollo/client';
import { BaseField, Field } from '@puckeditor/core';
import { ReactElement, ReactNode } from 'react';

export type ApiPageInfo = {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
};

export type PaginatedType<T> = {
  nodes: T[];
  totalCount: number;
  pageInfo: ApiPageInfo;
};

export type ApiFetchListParams = {
  query: string;
  filters: Record<string, unknown>;
  cursor?: string | null;
  take: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiField<Item = any, Props = Item> = BaseField & {
  type: 'api';
  placeholder?: string;
  useFetchList: (
    client: ApolloClient<object>,
    params: ApiFetchListParams
  ) => PaginatedType<Item> | undefined;
  mapProp?: (item: Item) => Props;
  mapRow?: (item: Item) => Record<string, string | number | ReactElement>;
  getItemSummary?: (item: Props, index?: number) => ReactNode;
  showSearch?: boolean;
  renderFooter?: (props: { items: Item[]; totalCount: number }) => ReactElement;
  initialQuery?: string;
  filterFields?: Record<string, Field>;
  initialFilters?: Record<string, unknown>;
  take?: number;
};

export const defaultApiFieldTake = 25;
