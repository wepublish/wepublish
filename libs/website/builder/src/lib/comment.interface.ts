import {ApolloError, MutationResult, QueryResult} from '@apollo/client'
import {
  AddCommentMutation,
  AddCommentMutationVariables,
  ChallengeQuery,
  Comment,
  CommentListQuery,
  CommentListQueryVariables,
  EditCommentMutation,
  EditCommentMutationVariables
} from '@wepublish/website/api'
import {Dispatch} from 'react'
import {Node} from 'slate'

export type BuilderCommentListStateTypes = 'add' | 'edit'

export type BuilderCommentListAction = {
  action: string
}

export type BuilderCommentListOpenAction = {
  action: 'open'
  type: BuilderCommentListStateTypes
  commentId: string | null | undefined
}

export type BuilderCommentListCloseAction = {
  action: 'close'
  type: BuilderCommentListStateTypes
  commentId: string | null | undefined
}

export type BuilderCommentListActions = BuilderCommentListOpenAction | BuilderCommentListCloseAction

export type BuilderCommentListState = Record<
  `${BuilderCommentListStateTypes}:${string | null}`,
  boolean
>

export type BuilderCommentListProps = Pick<
  QueryResult<CommentListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  anonymousCanComment?: boolean
  anonymousCanRate?: boolean
  userCanEdit?: boolean
  maxCommentLength: number
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'>

  variables?: Omit<CommentListQueryVariables, 'itemId'>
  onVariablesChange?: (variables: Omit<CommentListQueryVariables, 'itemId'>) => void

  add: MutationResult<AddCommentMutation>
  onAddComment: (
    variables: Omit<AddCommentMutationVariables['input'], 'itemID' | 'itemType' | 'peerId'>
  ) => void

  edit: MutationResult<EditCommentMutation>
  onEditComment: (variables: EditCommentMutationVariables['input']) => void

  openEditorsState: BuilderCommentListState
  openEditorsStateDispatch: Dispatch<BuilderCommentListActions>
}

export type BuilderCommentListItemProps = Comment & {
  className?: string
} & Pick<
    BuilderCommentListProps,
    | 'anonymousCanComment'
    | 'anonymousCanRate'
    | 'maxCommentLength'
    | 'userCanEdit'
    | 'challenge'
    | 'add'
    | 'onAddComment'
    | 'edit'
    | 'onEditComment'
    | 'openEditorsState'
    | 'openEditorsStateDispatch'
  >

type CreateCommentProps = {
  text?: never
  title?: never
  lead?: never
  challenge: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error'> | null
  onSubmit: (
    data: Omit<AddCommentMutationVariables['input'], 'itemID' | 'itemType' | 'parentID' | 'peerId'>
  ) => void
}

type EditCommentProps = {
  text?: Node[] | null
  title?: string | null
  lead?: string | null
  challenge?: never
  onSubmit: (data: Omit<EditCommentMutationVariables['input'], 'id'>) => void
}

export type BuilderCommentEditorProps = {
  onCancel: () => void
  className?: string
  maxCommentLength: number
  loading: boolean
  error?: ApolloError
} & (CreateCommentProps | EditCommentProps)
