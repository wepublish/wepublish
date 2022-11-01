import React, {useEffect, useState} from 'react'

import {FullCommentFragment, useCommentListQuery} from '../../api'
import {CommentPreview} from './commentPreview'

interface ChildCommentsProps {
  comments?: FullCommentFragment[]
  comment: FullCommentFragment
  originComment?: FullCommentFragment
}

function ChildComments({comments, comment, originComment}: ChildCommentsProps) {
  if (!comments) {
    return <></>
  }
  const childComments = comments.filter(tmpComment => tmpComment.parentComment?.id === comment.id)
  return (
    <div style={{marginTop: '20px', borderLeft: '1px lightgrey solid', paddingLeft: '20px'}}>
      {childComments.map(childComment => (
        <div key={childComment.id}>
          <CommentPreview comment={childComment} expanded={childComment.id === originComment?.id} />
          {/* some fancy recursion */}
          <ChildComments comments={comments} comment={childComment} originComment={originComment} />
        </div>
      ))}
    </div>
  )
}

interface CommentHistoryProps {
  comment: FullCommentFragment
}

export function CommentHistory({comment}: CommentHistoryProps) {
  const [comments, setComments] = useState<FullCommentFragment[] | undefined>()
  const {data} = useCommentListQuery({
    variables: {
      filter: {
        itemType: comment.itemType,
        itemID: comment.itemID
      },
      sort: 'CreatedAt',
      take: 1000
    }
  })

  useEffect(() => {
    setComments(data?.comments?.nodes)
  }, [data])

  return (
    <>
      {comments &&
        comments.map(tmpComment => (
          <div key={tmpComment.id}>
            {!tmpComment.parentComment && (
              <>
                <CommentPreview comment={tmpComment} expanded={tmpComment.id === comment.id} />
                <ChildComments comment={tmpComment} originComment={comment} comments={comments} />
              </>
            )}
          </div>
        ))}
    </>
  )
}
