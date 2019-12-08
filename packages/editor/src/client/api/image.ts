import gql from 'graphql-tag'
import {useMutation} from '@apollo/react-hooks'
import {ImageTransformation} from './types'

const ImageUploadMutation = gql`
  mutation($input: UploadImageInput!, $transformations: [ImageTransformation!]) {
    uploadImage(input: $input) {
      id
      width
      height
      url
      transform(input: $transformations)
    }
  }
`

export interface InputPoint {
  readonly x: number
  readonly y: number
}

export interface ImageUploadMutationData {
  readonly uploadImage: {
    readonly id: string
    readonly url: string
    readonly transform: string[]
    readonly width: number
    readonly height: number
  }
}

export interface UploadImageInput {
  readonly file: File
  readonly filename?: string
  readonly title?: string
  readonly description?: string
  readonly tags?: string[]

  readonly author?: string
  readonly source?: string
  readonly license?: string

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
