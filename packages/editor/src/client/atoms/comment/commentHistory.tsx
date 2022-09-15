import React, {ReactChild, useEffect, useState} from 'react'

import {FullCommentFragment, useCommentListQuery} from '../../api'
import {CommentPreview} from './commentPreview'

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
      }
    }
  })

  useEffect(() => {
    setComments(data?.comments?.nodes)
  }, [data])

  function getChildComments(originComment: FullCommentFragment): ReactChild {
    if (!comments) {
      return <></>
    }
    const childComments = comments.filter(
      tmpComment => tmpComment.parentComment?.id === originComment.id
    )
    return (
      <div style={{marginTop: '20px', borderLeft: '1px lightgrey solid', paddingLeft: '20px'}}>
        {childComments.map(childComment => (
          <div key={childComment.id}>
            <CommentPreview comment={childComment} expanded={childComment.id === comment.id} />
            {/* some fancy recursion */}
            {getChildComments(childComment)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {comments &&
        comments.map(tmpComment => (
          <div key={tmpComment.id}>
            {!tmpComment.parentComment && (
              <>
                <CommentPreview comment={tmpComment} expanded={tmpComment.id === comment.id} />
                {getChildComments(tmpComment)}
              </>
            )}
          </div>
        ))}
    </>
  )
}
