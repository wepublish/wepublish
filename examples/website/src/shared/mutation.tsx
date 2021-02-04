import gql from 'graphql-tag'
import {useMutation} from 'react-apollo'
import {CommentItemType} from '../../../../packages/api/lib'

export type CommentInput = {
  parentID?: string
  itemID: string
  itemType: CommentItemType
  text: string
}

export type MutationAddCommentArgs = {
  input: CommentInput
}

export const MutationComment = gql`
  fragment MutationComment on Comment {
    itemID
    itemType
    user {
      id
    }
    text
    parentID
  }
`

export const AddComment = gql`
  mutation AddComment($input: CommentInput!) {
    addComment(input: $input) {
      ...MutationComment
    }
  }
  ${MutationComment}
`

export function useCommentMutation() {
  return useMutation(AddComment)
}
