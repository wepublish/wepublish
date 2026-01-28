import {
  useDislikeArticleMutation,
  useLikeArticleMutation,
} from '@wepublish/website/api';
import { useCallback, useEffect, useState } from 'react';
import { useCounter } from 'usehooks-ts';

const LIKED_KEY = 'likedArticles';

export function useLikeStatus(articleId: string, articleLikes: number) {
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const {
    count: likes,
    setCount: setLikes,
    increment: incrementLikes,
    decrement: decrementLikes,
  } = useCounter(articleLikes || 0);

  const updateLikeStatus = useCallback(
    (liked: boolean) => {
      const likedArticles = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');

      if (liked && !likedArticles.includes(articleId)) {
        likedArticles.push(articleId);
      }

      if (!liked) {
        const index = likedArticles.indexOf(articleId);

        if (index > -1) {
          likedArticles.splice(index, 1);
        }
      }

      localStorage.setItem(LIKED_KEY, JSON.stringify(likedArticles));
      setIsLiked(liked);
    },
    [articleId]
  );

  const [removeLikeMutation] = useDislikeArticleMutation({
    variables: {
      id: articleId,
    },
  });

  const [addLikeMutation] = useLikeArticleMutation({
    variables: {
      id: articleId,
    },
  });

  const handleLike = useCallback(
    async (preventDislike?: boolean) => {
      // wait until isLiked state is properly set and therefore ready
      if (!isReady) {
        return;
      }

      // prevent dislikes
      if (isLiked && !preventDislike) {
        decrementLikes();
        updateLikeStatus(false);
        await removeLikeMutation();
      } else if (!isLiked) {
        incrementLikes();
        updateLikeStatus(true);
        await addLikeMutation();
      }
    },
    [
      addLikeMutation,
      decrementLikes,
      incrementLikes,
      isLiked,
      removeLikeMutation,
      updateLikeStatus,
      isReady,
    ]
  );

  useEffect(() => {
    // if no article id given, avoiding wrong isLiked state
    if (!articleId) {
      return;
    }

    if (typeof window !== 'undefined') {
      const likedArticles = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
      setIsLiked(likedArticles.includes(articleId));
      setIsReady(true);
    }
  }, [articleId]);

  useEffect(() => {
    setLikes(articleLikes ?? 0);
  }, [articleLikes, setLikes]);

  return { likes, isLiked, isReady, handleLike };
}
