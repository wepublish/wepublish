import {ApiV1, AuthorListContainer} from '@wepublish/website'
import {Reducer, useReducer} from 'react'

export default function AuthorList() {
  const [variables, onVariablesChange] = useReducer<
    Reducer<Partial<ApiV1.AuthorListQueryVariables>, Partial<ApiV1.AuthorListQueryVariables>>
  >(
    (state, newVariables) => ({
      ...state,
      ...newVariables
    }),
    {
      take: 10,
      skip: 0,
      sort: ApiV1.AuthorSort.CreatedAt,
      order: ApiV1.SortOrder.Ascending
    } as Partial<ApiV1.AuthorListQueryVariables>
  )

  return <AuthorListContainer variables={variables} onVariablesChange={onVariablesChange} />
}
