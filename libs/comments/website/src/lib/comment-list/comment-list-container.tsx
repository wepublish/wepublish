import {
  AddCommentMutation,
  ChallengeQuery,
  Comment,
  CommentItemType,
  CommentListDocument,
  CommentListQuery,
  CommentListQueryVariables,
  CommentState,
  EditCommentMutation,
  SettingListQuery,
  SettingName,
  useAddCommentMutation,
  useChallengeLazyQuery,
  useEditCommentMutation,
  useSettingListQuery
} from '@wepublish/website/api'
import {MutationResult, QueryResult} from '@apollo/client'
import {useEffect, useReducer} from 'react'
import {useCommentListQuery} from '@wepublish/website/api'
import {
  BuilderContainerProps,
  useWebsiteBuilder,
  BuilderCommentListProps
} from '@wepublish/website/builder'
import {useUser} from '@wepublish/authentication/website'
import {commentListReducer} from './comment-list.state'
import {produce} from 'immer'

type PeerArticleComments = {
  type: CommentItemType.PeerArticle
  peerId: string
}

type ArticleOrPageComments = {
  type: CommentItemType
  peerId?: never
}

export type CommentListContainerProps = {
  id: string

  onChallengeQuery?: (
    queryResult: Pick<QueryResult<ChallengeQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onSettingListQuery?: (
    queryResult: Pick<QueryResult<SettingListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onCommentListQuery?: (
    queryResult: Pick<QueryResult<CommentListQuery>, 'data' | 'loading' | 'error' | 'refetch'>
  ) => void

  onAddComment?: (
    mutationResult: Pick<MutationResult<AddCommentMutation>, 'data' | 'loading' | 'error'>
  ) => void

  onEditComment?: (
    mutationResult: Pick<MutationResult<EditCommentMutation>, 'data' | 'loading' | 'error'>
  ) => void
} & BuilderContainerProps &
  Pick<BuilderCommentListProps, 'variables' | 'onVariablesChange'> &
  (PeerArticleComments | ArticleOrPageComments)

export function CommentListContainer({
  className,
  variables,
  id,
  type,
  peerId,
  onVariablesChange,
  onCommentListQuery,
  onChallengeQuery,
  onSettingListQuery,
  onAddComment,
  onEditComment
}: CommentListContainerProps) {
  const {CommentList} = useWebsiteBuilder()
  const {hasUser} = useUser()
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {})

  const settings = useSettingListQuery({})
  const [fetchChallenge, challenge] = useChallengeLazyQuery()

  const {data, loading, error, refetch} = useCommentListQuery({
    variables: {
      ...variables,
      itemId: id
    }
  })

  const [addComment, add] = useAddCommentMutationWithCacheUpdate(
    {
      ...variables,
      itemId: id
    },
    {
      onCompleted: async data => {
        dispatch({
          type: 'add',
          action: 'close',
          commentId: data.addComment.parentID
        })

        if (!hasUser) {
          challenge.refetch()
        }
      },
      onError: () => {
        if (!hasUser) {
          challenge.refetch()
        }
      }
    }
  )

  const [editComment, edit] = useEditCommentMutationWithCacheUpdate(
    {
      ...variables,
      itemId: id
    },
    {
      onCompleted: async data => {
        dispatch({
          type: 'edit',
          action: 'close',
          commentId: data.updateComment.id
        })

        if (!hasUser) {
          challenge.refetch()
        }
      },
      onError: () => {
        if (!hasUser) {
          challenge.refetch()
        }
      }
    }
  )

  useEffect(() => {
    if (!hasUser) {
      fetchChallenge()
    }
  }, [hasUser, fetchChallenge])

  useEffect(() => {
    onCommentListQuery?.({data, loading, error, refetch})
  }, [data, loading, error, refetch, onCommentListQuery])

  useEffect(() => {
    if (challenge.called) {
      onChallengeQuery?.(challenge)
    }
  }, [challenge, onChallengeQuery])

  useEffect(() => {
    onSettingListQuery?.(settings)
  }, [settings, onSettingListQuery])

  useEffect(() => {
    if (edit.called) {
      onEditComment?.(edit)
    }
  }, [edit, onEditComment])

  useEffect(() => {
    if (add.called) {
      onAddComment?.(add)
    }
  }, [add, onAddComment])

  return (
    <CommentList
      data={data}
      loading={loading || settings.loading}
      error={error ?? settings.error}
      challenge={challenge}
      className={className}
      variables={variables}
      onVariablesChange={onVariablesChange}
      openEditorsState={openCommentEditors}
      openEditorsStateDispatch={dispatch}
      add={add}
      onAddComment={input => {
        addComment({
          variables: {
            input: {
              ...input,
              itemID: id,
              itemType: type,
              peerId
            }
          }
        })
      }}
      edit={edit}
      onEditComment={input => {
        editComment({
          variables: {
            input
          }
        })
      }}
      maxCommentLength={
        settings.data?.settings.find(setting => setting.name === SettingName.CommentCharLimit)
          ?.value ?? 1000
      }
      anonymousCanComment={
        settings.data?.settings.find(setting => setting.name === SettingName.AllowGuestCommenting)
          ?.value
      }
      anonymousCanRate={
        settings.data?.settings.find(
          setting => setting.name === SettingName.AllowGuestCommentRating
        )?.value
      }
      userCanEdit={
        settings.data?.settings.find(setting => setting.name === SettingName.AllowCommentEditing)
          ?.value
      }
    />
  )
}

const extractAllComments = (comments: Comment[]): Comment[] => {
  const allComments = [] as Comment[]

  for (const comment of comments) {
    allComments.push(comment)

    if (comment.children?.length) {
      allComments.push(...extractAllComments(comment.children))
    }
  }

  return allComments
}

const useAddCommentMutationWithCacheUpdate = (
  variables: CommentListQueryVariables,
  ...params: Parameters<typeof useAddCommentMutation>
) =>
  useAddCommentMutation({
    ...params[0],
    update: (cache, {data}) => {
      const query = cache.readQuery<CommentListQuery>({
        query: CommentListDocument,
        variables
      })

      if (!query || !data?.addComment) {
        return
      }

      const updatedComments = produce(query.comments, comments => {
        const allComments = extractAllComments(comments)
        const parentComment = allComments.find(comment => comment.id === data.addComment.parentID)

        if (parentComment) {
          parentComment.children.unshift(data.addComment as Comment)
        } else {
          comments.unshift(data.addComment)
        }
      })

      cache.writeQuery<CommentListQuery>({
        query: CommentListDocument,
        data: {
          comments: updatedComments
        },
        variables
      })
    }
  })

const useEditCommentMutationWithCacheUpdate = (
  variables: CommentListQueryVariables,
  ...params: Parameters<typeof useEditCommentMutation>
) =>
  useEditCommentMutation({
    ...params[0],
    update: (cache, {data}) => {
      const query = cache.readQuery<CommentListQuery>({
        query: CommentListDocument,
        variables
      })

      if (!query || !data?.updateComment) {
        return
      }

      const updatedComments = produce(query.comments, comments => {
        const allComments = extractAllComments(comments)

        const oldComment = allComments.find(comment => comment.id === data.updateComment.id)

        if (oldComment) {
          oldComment.title = data.updateComment.title
          oldComment.lead = data.updateComment.lead
          oldComment.text = data.updateComment.text
          oldComment.state = CommentState.PendingApproval
        }
      })

      cache.writeQuery<CommentListQuery>({
        query: CommentListDocument,
        data: {
          comments: updatedComments
        },
        variables
      })
    }
  })
