import gql from 'graphql-tag'
import {useMutation} from '@apollo/react-hooks'
import {ImageTransformation} from './types'

const ImageUploadMutation = gql`
  mutation($input: UploadImageInput!, $transformations: [ImageTransformation!]) {
    uploadImage(input: $input) {
      id
      width
      height
      transform(input: $transformations)
    }
  }
`

export interface InputPoint {
  readonly x: number
  readonly y: number
}

export interface ImageUploadMutationData {
  readonly uploadImages: Array<{
    readonly id: string
    readonly transform: string[]
    readonly width: number
    readonly height: number
  }>
}

export interface UploadImageInput {
  readonly file: File
  readonly filename?: string
  readonly title?: string
  readonly description?: string
  readonly source?: string
  readonly tags?: string[]
  readonly focalPoint?: InputPoint
}

export interface ImageUploadMutationVariables {
  readonly input: UploadImageInput
  readonly transformations: ImageTransformation[]
}

export interface ImageUploadNode {
  readonly id: string
  readonly transform: string[]
}

export function useImageUploadMutation() {
  return useMutation<ImageUploadMutationData, ImageUploadMutationVariables>(ImageUploadMutation)
}
