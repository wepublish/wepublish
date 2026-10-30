import { useMutation, useQuery } from '@apollo/client/react';
import { useUser } from '@wepublish/authentication/website';
import {
  RateCommentDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import { PropsWithChildren, useMemo } from 'react';
import { CommentRatingContext } from './comment-ratings.context';

const getAnonymousRate = (
  commentId: string,
  answerId: string
): number | null => {
  const voteValue =
    typeof localStorage !== 'undefined' ?
      localStorage.getItem(`comment-rate:${commentId}:${answerId}`)
    : null;

  return voteValue ? +voteValue : null;
};

const setAnonymousRate = (commentId: string, answerId: string, value: number) =>
  localStorage.setItem(
    `comment-rate:${commentId}:${answerId}`,
    value.toString()
  );

export function CommentRatingsProvider({ children }: PropsWithChildren) {
  const { hasUser } = useUser();
  const [rate] = useMutation(RateCommentDocument, {
    onCompleted(_, options) {
      const { commentId, answerId, value } = options?.variables ?? {};

      if (!hasUser && commentId && answerId && value != null) {
        setAnonymousRate(commentId, answerId, value);
      }
    },
  });
  const { data: settings } = useQuery(SettingListDocument);

  const canRateAnonymously = useMemo(
    () =>
      !!settings?.settings.find(
        setting => setting.name === SettingName.AllowGuestCommentRating
      )?.value,
    [settings?.settings]
  );

  return (
    <CommentRatingContext.Provider
      value={{
        rate,
        canRateAnonymously,
        getAnonymousRate,
      }}
    >
      {children}
    </CommentRatingContext.Provider>
  );
}
