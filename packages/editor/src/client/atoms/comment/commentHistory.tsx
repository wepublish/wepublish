import React, {useEffect, useState} from 'react'

import {CommentItemType, FullCommentFragment, useCommentListQuery} from '../../api'

interface CommentHistoryProps {
  itemType: CommentItemType
  itemID: string
}

export function CommentHistory({itemType, itemID}: CommentHistoryProps) {
  const [comments, setComments] = useState<FullCommentFragment[] | undefined>()
  const {data} = useCommentListQuery({
    variables: {
      filter: {
        itemType,
        itemID
      }
    }
  })

  useEffect(() => {
    setComments(data?.comments?.nodes)
    console.log(comments)
  }, [data])

  return <></>
}
