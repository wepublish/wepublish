import {ApiV1, ArticleListContainer} from '@wepublish/website'
import {Reducer, useReducer} from 'react'

export default function ArticleList() {
  const [variables, onVariablesChange] = useReducer<
    Reducer<Partial<ApiV1.ArticleListQueryVariables>, Partial<ApiV1.ArticleListQueryVariables>>
  >(
    (state, newVariables) => ({
      ...state,
      ...newVariables
    }),
    {
      take: 10,
      skip: 0,
      sort: ApiV1.ArticleSort.PublishedAt,
      order: ApiV1.SortOrder.Ascending
    } as Partial<ApiV1.ArticleListQueryVariables>
  )

  return <ArticleListContainer variables={variables} onVariablesChange={onVariablesChange} />
}
