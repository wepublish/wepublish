import gql from 'graphql-tag'
import {useMutation, useQuery, QueryHookOptions, MutationHookOptions} from '@apollo/react-hooks'
import {PageInfo} from './common'

export interface FocalPoint {
  x: number
  y: number
}

export interface ImageRefData {
  id: string

  filename?: string
  extension: string
  title?: string
  description?: string

  width: number
  height: number

  url: string
  largeURL: string
  mediumURL: string
  thumbURL: string

  column1URL: string
  column6URL: string
  previewURL: string
  squareURL: string
}

export interface ImageData extends ImageRefData {
  readonly id: string
  readonly createdAt: string
  readonly modifiedAt: string

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

export interface UpdateImageInput extends BaseImageInput {}

export const ImageURLFragment = gql`
  fragment ImageURLFragment on Image {
    url
    largeURL: transformURL(input: {width: 500})
    mediumURL: transformURL(input: {width: 300})
    thumbURL: transformURL(input: {width: 280, height: 200})
    squareURL: transformURL(input: {width: 100, height: 100})
    previewURL: transformURL(input: {width: 400, height: 200})
    column1URL: transformURL(input: {width: 800, height: 300})
    column6URL: transformURL(input: {width: 260, height: 300})
  }
`

export const ImageRefFragment = gql`
  fragment ImageRefFragment on Image {
    id
    filename
    extension
    title
    description
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
    modifiedAt

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
  query($filter: String, $after: ID, $before: ID, $first: Int, $last: Int) {
    images(filter: {title: $filter}, after: $after, before: $before, first: $first, last: $last) {
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
  readonly filter?: string
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
  readonly id: string
  readonly input: UpdateImageInput
}

const ImageUpdateMutation = gql`
  mutation($id: ID!, $input: UpdateImageInput!) {
    updateImage(id: $id, input: $input) {
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

const DeleteImageMutation = gql`
  mutation DeleteImage($id: ID!) {
    deleteImage(id: $id)
  }
`

export interface DeleteImageMutationData {
  deleteImage?: boolean
}

export interface DeleteImageVariables {
  id: string
}

export function useDeleteImageMutation(
  opts?: MutationHookOptions<DeleteImageMutationData, DeleteImageVariables>
) {
  return useMutation<DeleteImageMutationData, DeleteImageVariables>(DeleteImageMutation, opts)
}
