import gql from 'graphql-tag'
import {useMutation} from '@apollo/react-hooks'
import {ImageTransformation} from './types'

const ImageUploadMutation = gql`
  mutation($images: [Upload!]!, $transformations: [ImageTransformation!]) {
    uploadImages(images: $images) {
      id
      width
      height
      transform(transformations: $transformations)
    }
  }
`

export interface ImageUploadMutationData {
  readonly uploadImages: Array<{
    readonly id: string
    readonly transform: string[]
    readonly width: number
    readonly height: number
  }>
}

export interface ImageUploadMutationVariables {
  readonly images: File[]
  readonly transformations: ImageTransformation[]
}

export interface ImageUploadNode {
  readonly id: string
  readonly transform: string[]
}

export function useImageUploadMutation() {
  return useMutation<ImageUploadMutationData, ImageUploadMutationVariables>(ImageUploadMutation)
}
