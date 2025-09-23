import { useUser } from '@wepublish/authentication/website';
import {
  SettingName,
  useRateCommentMutation,
  useSettingListQuery,
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
  const [rate] = useRateCommentMutation({
    onCompleted(_, options) {
      if (options?.variables && !hasUser) {
        setAnonymousRate(
          options.variables.commentId,
          options.variables.answerId,
          options.variables.value
        );
      }
    },
  });
  const { data: settings } = useSettingListQuery();

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
