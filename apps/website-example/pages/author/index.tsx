import {ApiV1, AuthorListContainer} from '@wepublish/website'

export default function AuthorList() {
  return (
    <AuthorListContainer
      variables={{
        take: 10,
        skip: 0,
        sort: ApiV1.AuthorSort.CreatedAt,
        order: ApiV1.SortOrder.Ascending
      }}
    />
  )
}
