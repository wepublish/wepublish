import gql from 'graphql-tag'
import {articleMetaDataFragment, simpleImageDataFragment} from './route/gqlFragments'
import {QueryHookOptions, useQuery} from 'react-apollo'
import {ArticleReference, PageInfo, ImageRefData} from './types'

// TODO: Don't use slate Node type, export client side friendly types from @wepublish/api/types package.
// TODO: Remove slate from dependencies.
import {Node} from 'slate'

export interface ListArticlesData {
  articles: {
    nodes: ArticleReference[]
    pageInfo: PageInfo
    totalCount: number
  }
}

export interface ListArticlesVariables {
  first: number
  cursor?: string | null
  filter?: string[] | string
  id?: string
}

const ArticleTagQuery = gql`
  query ArticleTag($first: Int, $filter: [String!], $cursor: ID) {
    articles(first: $first, after: $cursor, filter: {tags: $filter}) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        id
        ...ArticleMetaData
      }
    }
  }
  ${articleMetaDataFragment}
`

export function useListArticlesQuery(
  opts?: QueryHookOptions<ListArticlesData, ListArticlesVariables>
) {
  return useQuery<ListArticlesData, ListArticlesVariables>(ArticleTagQuery, opts)
}

export interface AuthorLink {
  title: string
  url: string
}

export interface Author {
  name: string
  image?: ImageRefData
  links?: AuthorLink[]
  bio?: Node[]
}

export interface ListArticlesDataByAuthor extends ListArticlesData {
  author?: Author
}

const ArticlesByAuthor = gql`
  query Author($first: Int, $cursor: ID, $id: ID!, $filter: String!) {
    author(id: $id) {
      name
      image {
        ...SimpleImageData
      }
      links {
        title
        url
      }
      bio
    }
    articles(first: $first, after: $cursor, filter: {authors: [$filter]}) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        ...ArticleMetaData
      }
    }
  }
  ${simpleImageDataFragment}
  ${articleMetaDataFragment}
`

export function useListArticlesByAuthorQuery(
  opts?: QueryHookOptions<ListArticlesDataByAuthor, ListArticlesVariables>
) {
  return useQuery<ListArticlesDataByAuthor, ListArticlesVariables>(ArticlesByAuthor, opts)
}
