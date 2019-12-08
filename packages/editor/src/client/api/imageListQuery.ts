import gql from 'graphql-tag'
import {useQuery} from '@apollo/react-hooks'
import {ImageTransformation} from './types'

const ImageListQuery = gql`
  query(
    $after: ID
    $before: ID
    $first: Int
    $last: Int
    $transformations: [ImageTransformation!]!
  ) {
    images(after: $after, before: $before, first: $first, last: $last) {
      nodes {
        id
        width
        height
        url
        transform(input: $transformations)
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export interface ImageListQueryData {
  readonly images: {
    readonly nodes: Array<{
      readonly id: string
      readonly url: string
      readonly transform: string[]
      readonly width: number
      readonly height: number
    }>

    readonly pageInfo: PageInfo
  }
}

export interface ImageListQueryVariables {
  readonly after?: string
  readonly before?: string
  readonly first?: number
  readonly last?: number
  readonly transformations: ImageTransformation[]
}

export interface PageInfo {
  readonly startCursor?: string
  readonly endCursor?: string
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}

export interface ImageListQueryOptions {
  readonly after?: string
  readonly before?: string
  readonly pageLimit: number
  readonly transformations: ImageTransformation[]
}

export function useImageListQuery({
  after,
  before,
  pageLimit,
  transformations
}: ImageListQueryOptions) {
  return useQuery<ImageListQueryData, ImageListQueryVariables>(ImageListQuery, {
    fetchPolicy: 'no-cache',
    variables: {
      after,
      before,
      first: before ? undefined : pageLimit,
      last: before ? pageLimit : undefined,
      transformations
    }
  })
}
