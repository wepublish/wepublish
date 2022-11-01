import PlusIcon from '@rsuite/icons/legacy/Plus'
import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid} from 'rsuite'

import {FullCommentFragment, useCommentListQuery} from '../../api'
import {CommentPreview} from './commentPreview'
import {CreateCommentBtn} from './createCommentBtn'

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
  const {t} = useTranslation()
  const [comments, setComments] = useState<FullCommentFragment[] | undefined>()
  const {data, refetch} = useCommentListQuery({
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

  useEffect(() => {
    refetch()
  }, [comment])

  return (
    <>
      <FlexboxGrid align="bottom" justify="end">
        <FlexboxGrid.Item style={{textAlign: 'end', paddingBottom: '20px'}} colspan={24}>
          <CreateCommentBtn
            itemID={comment.itemID}
            itemType={comment.itemType}
            text={t('commentHistory.addComment')}
            color="green"
            appearance="ghost"
            icon={<PlusIcon />}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>

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
