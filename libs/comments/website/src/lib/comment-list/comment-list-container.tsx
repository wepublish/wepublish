import {useUser} from '@wepublish/authentication/website'
import {
  Comment,
  CommentItemType,
  CommentListDocument,
  CommentListQuery,
  CommentListQueryVariables,
  SettingName,
  useAddCommentMutation,
  useChallengeLazyQuery,
  useCommentListQuery,
  useEditCommentMutation,
  useSettingListQuery
} from '@wepublish/website/api'
import {
  BuilderCommentListProps,
  BuilderContainerProps,
  useWebsiteBuilder
} from '@wepublish/website/builder'
import {produce} from 'immer'
import {useEffect, useReducer} from 'react'
import {commentListReducer} from './comment-list.state'
import {CommentRatingsProvider} from '../comment-ratings/comment-ratings.provider'

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
} & BuilderContainerProps &
  Pick<BuilderCommentListProps, 'variables' | 'onVariablesChange'> &
  (PeerArticleComments | ArticleOrPageComments)

export function CommentListContainer({
  className,
  variables,
  id,
  type,
  peerId,
  onVariablesChange
}: CommentListContainerProps) {
  const {CommentList} = useWebsiteBuilder()
  const {hasUser} = useUser()
  const [openCommentEditors, dispatch] = useReducer(commentListReducer, {})

  const settings = useSettingListQuery({})
  const [fetchChallenge, challenge] = useChallengeLazyQuery()

  const {data, loading, error} = useCommentListQuery({
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

  const [editComment, edit] = useEditCommentMutation({
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
  })

  useEffect(() => {
    if (!hasUser) {
      fetchChallenge()
    }
  }, [hasUser, fetchChallenge])

  return (
    <CommentRatingsProvider>
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
    </CommentRatingsProvider>
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
          comments: updatedComments,
          ratingSystem: query.ratingSystem
        },
        variables
      })
    }
  })
