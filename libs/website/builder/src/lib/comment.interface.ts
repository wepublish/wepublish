import {QueryResult} from '@apollo/client'
import {Comment, CommentListQuery, CommentListQueryVariables} from '@wepublish/website/api'

export type BuilderCommentListProps = Pick<
  QueryResult<CommentListQuery>,
  'data' | 'loading' | 'error'
> & {
  className?: string
  variables?: Omit<CommentListQueryVariables, 'itemId'>
  onVariablesChange?: (variables: Partial<CommentListQueryVariables>) => void
}

export type BuilderCommentListItemProps = Comment & {
  className?: string
}
