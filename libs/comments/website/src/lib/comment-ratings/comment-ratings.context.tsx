import { FetchResult, MutationFunctionOptions } from '@apollo/client';
import { useUser } from '@wepublish/authentication/website';
import {
  RateCommentMutation,
  RateCommentMutationVariables,
} from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export type CommentRatingContextProps = Partial<{
  canRateAnonymously: boolean;
  getAnonymousRate: (commentId: string, answerId: string) => number | null;
  rate: (
    options: MutationFunctionOptions<
      RateCommentMutation,
      RateCommentMutationVariables
    >
  ) => Promise<FetchResult<RateCommentMutation>>;
}>;

export const CommentRatingContext = createContext<CommentRatingContextProps>(
  {}
);

export const useCommentRating = () => {
  const { hasUser } = useUser();
  const { rate, canRateAnonymously, getAnonymousRate } =
    useContext(CommentRatingContext);

  if (!hasUser && canRateAnonymously && !getAnonymousRate) {
    throw new Error('CommentRatingContext has not been fully provided.');
  }

  if ((hasUser || canRateAnonymously) && !rate) {
    throw new Error('CommentRatingContext has not been fully provided.');
  }

  return {
    rate: rate!,
    canRateAnonymously,
    getAnonymousRate: getAnonymousRate!,
  };
};
