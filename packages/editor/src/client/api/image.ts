import gql from 'graphql-tag'
import {useMutation, useQuery, QueryHookOptions, MutationHookOptions} from '@apollo/react-hooks'

export interface FocalPoint {
  readonly x: number
  readonly y: number
}

export interface ImageRefData {
  readonly id: string

  readonly title?: string
  readonly width: number
  readonly height: number

  readonly url: string
  readonly largeURL: string
  readonly mediumURL: string
  readonly thumbURL: string
}

export interface ImageData extends ImageRefData {
  readonly id: string
  readonly createdAt: string
  readonly updatedAt: string

  readonly extension: string
  readonly fileSize: number

  readonly filename?: string
  readonly description?: string
  readonly tags: string[]

  readonly author?: string
  readonly source?: string
  readonly license?: string

  readonly focalPoint?: FocalPoint
}

export interface BaseImageInput {
  readonly filename?: string
  readonly title?: string
  readonly description?: string
  readonly tags?: string[]

  readonly author?: string
  readonly source?: string
  readonly license?: string

  readonly focalPoint?: FocalPoint
}

export interface UploadImageInput extends BaseImageInput {
  readonly file: File
}

export interface UpdateImageInput extends BaseImageInput {
  readonly id: string
}

export interface PageInfo {
  readonly startCursor?: string
  readonly endCursor?: string
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}

export const ImageURLFragment = gql`
  fragment ImageURLFragment on Image {
    url
    largeURL: transformURL(input: {width: 500})
    mediumURL: transformURL(input: {width: 300})
    thumbURL: transformURL(input: {height: 200})
  }
`

export const ImageRefFragment = gql`
  fragment ImageRefFragment on Image {
    id
    title
    width
    height
    ...ImageURLFragment
  }

  ${ImageURLFragment}
`

export const ImageFragment = gql`
  fragment ImageFragment on Image {
    id
    createdAt
    updatedAt

    filename
    extension
    width
    height
    fileSize

    description
    tags

    author
    source
    license

    focalPoint {
      x
      y
    }

    ...ImageRefFragment
  }

  ${ImageRefFragment}
`

const ImageUploadMutation = gql`
  mutation($input: UploadImageInput!) {
    uploadImage(input: $input) {
      ...ImageRefFragment
    }
  }

  ${ImageRefFragment}
`

export interface ImageUploadMutationData {
  readonly uploadImage: ImageRefData
}

export interface ImageUploadMutationVariables {
  readonly input: UploadImageInput
}

export function useImageUploadMutation(
  opts?: MutationHookOptions<ImageUploadMutationData, ImageUploadMutationVariables>
) {
  return useMutation(ImageUploadMutation, opts)
}

const ImageListQuery = gql`
  query($after: ID, $before: ID, $first: Int, $last: Int) {
    images(after: $after, before: $before, first: $first, last: $last) {
      nodes {
        ...ImageRefFragment
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }

  ${ImageRefFragment}
`

export interface ImageListQueryData {
  readonly images: {
    readonly nodes: ImageRefData[]
    readonly pageInfo: PageInfo
  }
}

export interface ImageListQueryVariables {
  readonly after?: string
  readonly before?: string
  readonly first?: number
  readonly last?: number
}

export function useImageListQuery(
  opts?: QueryHookOptions<ImageListQueryData, ImageListQueryVariables>
) {
  return useQuery(ImageListQuery, opts)
}

export interface ImageQueryData {
  readonly image: ImageData
}

export interface ImageQueryVariables {
  readonly id: string
}

const ImageQuery = gql`
  query($id: ID!) {
    image(id: $id) {
      ...ImageFragment
    }
  }

  ${ImageFragment}
`

export function useImageQuery(opts?: QueryHookOptions<ImageQueryData, ImageQueryVariables>) {
  return useQuery(ImageQuery, opts)
}

export interface ImageUpdateMutationData {
  readonly updateImage: ImageData
}

export interface ImageUpdateMutationVariables {
  readonly input: UpdateImageInput
}

const ImageUpdateMutation = gql`
  mutation($input: UpdateImageInput!) {
    updateImage(input: $input) {
      ...ImageFragment
    }
  }

  ${ImageFragment}
`

export function useImageUpdateMutation(
  opts?: MutationHookOptions<ImageUpdateMutationData, ImageUpdateMutationVariables>
) {
  return useMutation(ImageUpdateMutation, opts)
}
