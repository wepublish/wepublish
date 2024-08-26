import {Dispatch, SetStateAction, useState} from 'react'
import * as Apollo from '@apollo/client'
import {SortType} from '../utility'

type ExtractQueryType<T> = T extends Apollo.QueryResult<infer U, any> ? U : never
type ExtractQueryVariablesType<T> = T extends Apollo.QueryResult<any, infer V> ? V : never
type ExtractFilterType<T> = T extends {filter?: infer F} ? F : never
type ExtractSortType<T> = T extends {sort?: infer F} ? F : never
type ExtractOrderType<T> = T extends {order?: infer F} ? F : never

export type PaginationState<Variables = any> = {
  page: number
  setPage: Dispatch<SetStateAction<number>>
  limit: number
  setLimit: Dispatch<SetStateAction<number>>
}

export type QueryState<Variables = any> = {
  sortField: string
  setSortField: Dispatch<SetStateAction<string>>
  sortOrder: 'asc' | 'desc'
  setSortOrder: Dispatch<SetStateAction<'asc' | 'desc'>>
  filter: ExtractFilterType<Variables>
  setFilter: Dispatch<SetStateAction<ExtractFilterType<Variables>>>
} & PaginationState<Variables>

export type PaginatedStateContainer<Variables = any> = {
  state: QueryState<Variables>
  variables: {
    filter: ExtractFilterType<Variables>
    take: number
    skip: number
    sort: ExtractSortType<Variables> | null
    order: ExtractOrderType<Variables> | null
  }
}

export function createOptionalMapper<Key extends string | null, Value = any>(
  hash: Record<Exclude<Key, null>, Value>
) {
  return function (property: Key) {
    if (property === null) {
      return null
    } else if (property in hash) {
      return hash[property as Exclude<Key, null>]
    } else {
      return null
    }
  }
}

type PaginatedContainerProps<Variables> = {
  page?: number
  limit?: number
  filter?: ExtractFilterType<Variables>
  staticFilter?: ExtractFilterType<Variables>
  sortMapper: (sort: string) => ExtractSortType<Variables>
  orderMapper: (order: SortType) => ExtractOrderType<Variables> | null
}

export function usePaginatedContainer<Query extends Apollo.QueryResult>(
  props: PaginatedContainerProps<ExtractQueryVariablesType<Query>>
): PaginatedStateContainer<ExtractQueryVariablesType<Query>> {
  const {staticFilter, sortMapper, orderMapper} = props
  const [filter, setFilter] = useState(
    props.filter ?? ({} as ExtractFilterType<ExtractQueryVariablesType<Query>>)
  )
  const [page, setPage] = useState(props.page ?? 1)
  const [limit, setLimit] = useState(props.limit ?? 10)
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  return {
    state: {
      page,
      setPage,
      limit,
      setLimit,
      sortField,
      setSortField,
      sortOrder,
      setSortOrder,
      filter,
      setFilter
    },
    variables: {
      filter: {...(filter && filter), ...(staticFilter && staticFilter)},
      take: limit,
      skip: (page - 1) * limit,
      sort: sortMapper(sortField),
      order: orderMapper(sortOrder)
    }
  }
}
