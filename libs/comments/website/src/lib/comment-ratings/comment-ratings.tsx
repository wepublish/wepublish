import { NoSsr } from '@mui/material';
import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import {
  CalculatedRating,
  CommentRating,
  OverriddenRating,
  RateCommentMutationVariables,
  RatingSystemType,
} from '@wepublish/website/api';
import {
  BuilderCommentRatingsProps,
  useAsyncAction,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Fragment, useCallback, useState } from 'react';
import { useCommentRating } from './comment-ratings.context';
import { StarRating } from './star-rating';

export const CommentRatingsWrapper = styled('div')`
  display: grid;
`;

const getCommentRating = (
  answerId: string,
  userRatings: Pick<CommentRating, 'answer' | 'value'>[],
  calculatedRatings: Pick<CalculatedRating, 'answer' | 'mean'>[],
  overriddenRatings: Pick<OverriddenRating, 'answerId' | 'value'>[]
) => {
  const overriddenRating = overriddenRatings.find(
    rating => rating.answerId === answerId
  );
  const calculatedRating = calculatedRatings.find(
    rating => rating.answer.id === answerId
  );
  const userRating = userRatings.find(rating => rating.answer.id === answerId);

  return (
    userRating?.value ?? overriddenRating?.value ?? calculatedRating?.mean ?? 0
  );
};

const hasUserRated = (
  answerId: string,
  userRatings: Pick<CommentRating, 'answer' | 'value'>[]
) => {
  const userRating = userRatings.find(rating => rating.answer.id === answerId);

  return Boolean(userRating);
};

export const CommentRatings = ({
  commentId,
  ratingSystem,
  userRatings,
  calculatedRatings,
  overriddenRatings,
}: BuilderCommentRatingsProps) => {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();

  const { canRateAnonymously, getAnonymousRate, rate } = useCommentRating();
  const { hasUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const callAction = useAsyncAction(setLoading, setError);

  const canVote = hasUser || canRateAnonymously;
  const allUserRatings =
    hasUser ? userRatings : (
      ratingSystem.answers.flatMap(answer => {
        const value = getAnonymousRate(commentId, answer.id);

        if (!value) {
          return [];
        }

        return {
          answer,
          value,
        };
      })
    );

  const rateComment = useCallback(
    async ({ answerId, commentId, value }: RateCommentMutationVariables) =>
      callAction(async () => {
        await rate({
          variables: {
            commentId,
            answerId,
            value,
          },
        });
      })(),
    [callAction, rate]
  );

  const showRatingNames = ratingSystem.answers.length > 1;

  return (
    <CommentRatingsWrapper>
      <NoSsr>
        {ratingSystem.answers.map(answer => (
          <Fragment key={answer.id}>
            {answer.type === RatingSystemType.Star && (
              <StarRating
                name={showRatingNames ? answer.answer : null}
                hasRated={hasUserRated(answer.id, allUserRatings)}
                rating={getCommentRating(
                  answer.id,
                  allUserRatings,
                  calculatedRatings,
                  overriddenRatings
                )}
                onChange={rating =>
                  rateComment({
                    answerId: answer.id,
                    commentId,
                    value: rating,
                  })
                }
                readOnly={!canVote}
              />
            )}
          </Fragment>
        ))}
      </NoSsr>

      {error && <Alert severity="error">{error.message}</Alert>}
    </CommentRatingsWrapper>
  );
};
