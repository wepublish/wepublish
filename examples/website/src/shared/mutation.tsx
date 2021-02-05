import gql from 'graphql-tag'
import {useMutation} from 'react-apollo'
import {CommentItemType, RichTextNode} from '../../../../packages/api/lib'

export type CommentInput = {
  parentID?: string
  itemID: string
  itemType: CommentItemType
  text: RichTextNode[]
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
  return useMutation(AddComment, {
    onCompleted: data => console.log('Data from mutation', data),
    onError: error => console.error('Error creating a post', error)
  })
}
