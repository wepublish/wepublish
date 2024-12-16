import {ApiV1} from '@wepublish/website'
import {useCallback, useEffect, useState} from 'react'
import {useCounter} from 'usehooks-ts'

const LIKED_KEY = 'likedArticles'

export function useLikeStatus(articleId: string, articleLikes: number) {
  const [isLiked, setIsLiked] = useState(false)
  const {
    count: likes,
    setCount: setLikes,
    increment: incrementLikes,
    decrement: decrementLikes
  } = useCounter(articleLikes || 0)

  const updateLikeStatus = useCallback(
    (liked: boolean) => {
      const likedArticles = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')

      if (liked && !likedArticles.includes(articleId)) {
        likedArticles.push(articleId)
      }

      if (!liked) {
        const index = likedArticles.indexOf(articleId)

        if (index > -1) {
          likedArticles.splice(index, 1)
        }
      }

      localStorage.setItem(LIKED_KEY, JSON.stringify(likedArticles))
      setIsLiked(liked)
    },
    [articleId]
  )

  const [removeLikeMutation] = ApiV1.useRemoveLikeMutation({
    variables: {
      input: {
        articleId
      }
    }
  })

  const [addLikeMutation] = ApiV1.useAddLikeMutation({
    variables: {
      input: {
        articleId
      }
    }
  })

  const handleLike = useCallback(async () => {
    if (isLiked) {
      decrementLikes()
      updateLikeStatus(false)
      await removeLikeMutation()
    } else {
      incrementLikes()
      updateLikeStatus(true)
      await addLikeMutation()
    }
  }, [
    addLikeMutation,
    decrementLikes,
    incrementLikes,
    isLiked,
    removeLikeMutation,
    updateLikeStatus
  ])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const likedArticles = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')

      setIsLiked(likedArticles.includes(articleId))
    }
  }, [articleId])

  useEffect(() => {
    setLikes(articleLikes ?? 0)
  }, [articleLikes, setLikes])

  return {likes, isLiked, handleLike}
}
