import PlusIcon from '@rsuite/icons/legacy/Plus'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid} from 'rsuite'

import {
  CommentItemType,
  CommentSort,
  CommentState,
  FullCommentFragment,
  useCommentListLazyQuery
} from '../../api'
import {CommentPreview} from './commentPreview'
import {CreateCommentBtn} from './createCommentBtn'

interface ChildCommentsProps {
  comments?: FullCommentFragment[]
  comment: FullCommentFragment
  originCommentId?: string
}

function ChildComments({comments, comment, originCommentId}: ChildCommentsProps) {
  if (!comments) {
    return <></>
  }
  const childComments = comments.filter(tmpComment => tmpComment.parentComment?.id === comment.id)
  return (
    <div style={{marginTop: '20px', borderLeft: '1px lightgrey solid', paddingLeft: '20px'}}>
      {childComments.map(childComment => (
        <div key={childComment.id}>
          <CommentPreview comment={childComment} expanded={childComment.id === originCommentId} />
          {/* some fancy recursion */}
          <ChildComments
            comments={comments}
            comment={childComment}
            originCommentId={originCommentId}
          />
        </div>
      ))}
    </div>
  )
}

interface CommentHistoryProps {
  commentItemType: CommentItemType
  commentItemID: string
  commentId?: string
}

export function CommentHistory({commentId, commentItemType, commentItemID}: CommentHistoryProps) {
  const {t} = useTranslation()
  const [comments, setComments] = useState<FullCommentFragment[] | undefined>()
  const [fetchCommentList, {data}] = useCommentListLazyQuery({
    variables: {
      filter: {
        itemType: commentItemType,
        itemID: commentItemID,
        states: [
          CommentState.Approved,
          CommentState.PendingUserChanges,
          CommentState.PendingApproval
        ]
      },
      sort: CommentSort.CreatedAt,
      take: 1000
    },
    fetchPolicy: 'no-cache'
  })

  useEffect(() => {
    setComments(data?.comments?.nodes)
  }, [data])

  useEffect(() => {
    fetchCommentList()
  }, [commentId])

  return (
    <>
      <FlexboxGrid align="bottom" justify="end">
        <FlexboxGrid.Item style={{textAlign: 'end', paddingBottom: '20px'}} colspan={24}>
          <CreateCommentBtn
            itemID={commentItemID}
            itemType={commentItemType}
            text={t('commentHistory.addComment')}
            color="green"
            appearance="ghost"
            icon={<PlusIcon />}
            onCommentCreated={async () => {
              await fetchCommentList()
            }}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>

      {comments &&
        comments.map(tmpComment => (
          <div key={tmpComment.id}>
            {!tmpComment.parentComment && (
              <>
                <CommentPreview comment={tmpComment} expanded={tmpComment.id === commentId} />
                <ChildComments
                  comment={tmpComment}
                  originCommentId={commentId}
                  comments={comments}
                />
              </>
            )}
          </div>
        ))}
    </>
  )
}
