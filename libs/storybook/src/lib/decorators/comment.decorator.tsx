import {
  CommentRatingContextProps,
  CommentRatingContext,
} from '@wepublish/comments/website';
import { RateCommentMutationResult } from '@wepublish/website/api';
import { ComponentType } from 'react';
import { action } from '@storybook/addon-actions';

type CommentRatingsDecoratorProps = Partial<{
  rateResult: Pick<RateCommentMutationResult, 'data' | 'error'>;
  anonymousRateResult: CommentRatingContextProps['getAnonymousRate'];
  canRateAnonymously: boolean;
}>;

export const WithCommentRatingsDecorators =
  ({
    anonymousRateResult,
    canRateAnonymously,
    rateResult,
  }: CommentRatingsDecoratorProps) =>
  (Story: ComponentType) => {
    const rate = async (args: unknown) => {
      action('rate')(args);

      return rateResult || {};
    };

    const getAnonymousRate = (
      ...args: Parameters<NonNullable<typeof anonymousRateResult>>
    ): number | null => {
      action('getAnonymousRate')(args);

      return anonymousRateResult?.(...args) ?? null;
    };

    return (
      <CommentRatingContext.Provider
        value={{
          rate,
          canRateAnonymously,
          getAnonymousRate,
        }}
      >
        <Story />
      </CommentRatingContext.Provider>
    );
  };
