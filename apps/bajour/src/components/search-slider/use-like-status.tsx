import {useEffect, useState} from 'react'

export function useLikeStatus(articleId: string) {
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]')
      setIsLiked(likedArticles.includes(articleId))
    }
  }, [articleId])

  const updateLikeStatus = (liked: boolean) => {
    if (typeof window !== 'undefined') {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]')
      if (liked) {
        if (!likedArticles.includes(articleId)) {
          likedArticles.push(articleId)
        }
      } else {
        const index = likedArticles.indexOf(articleId)
        if (index > -1) {
          likedArticles.splice(index, 1)
        }
      }
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles))
      setIsLiked(liked)
    }
  }

  return {isLiked, updateLikeStatus}
}
