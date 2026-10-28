import {
  createCommentRatingContext,
  createPollBlockContext,
  createSubscribeBlockContext,
} from './block-contexts';

describe('block contexts', () => {
  it('answers poll votes with the given result and records the call', async () => {
    const voteOnPoll = {
      __typename: 'PollVote' as const,
      answerId: 'answer',
      pollId: 'poll',
    };
    const poll = createPollBlockContext({
      voteResult: { data: { __typename: 'Mutation', voteOnPoll } },
      anonymousVote: 'answer',
      canVoteAnonymously: true,
    });

    await expect(
      poll.vote({ variables: { answerId: 'answer' } }, 'poll')
    ).resolves.toEqual({ data: { __typename: 'Mutation', voteOnPoll } });
    expect(poll.vote).toHaveBeenCalledWith(
      { variables: { answerId: 'answer' } },
      'poll'
    );
    expect(poll.getAnonymousVote('poll')).toBe('answer');
    expect(poll.canVoteAnonymously).toBe(true);
  });

  it('answers comment ratings with the given error', async () => {
    const error = new Error('Something went wrong.');
    const ratings = createCommentRatingContext({ rateResult: { error } });

    await expect(
      ratings.rate({
        variables: { commentId: 'comment', answerId: 'answer', value: 3 },
      })
    ).resolves.toEqual({ data: undefined, error });
    expect(ratings.getAnonymousRate('comment', 'answer')).toBeNull();
  });

  it('starts the subscribe block with loading user data and idle mutations', async () => {
    const subscribe = createSubscribeBlockContext();

    expect(subscribe.userSubscriptions).toEqual({
      data: undefined,
      loading: true,
    });
    expect(subscribe.register[1]).toMatchObject({
      called: false,
      loading: false,
    });
    const args = [] as unknown as Parameters<typeof subscribe.subscribe>;

    await expect(subscribe.subscribe(...args)).resolves.toEqual({
      data: undefined,
    });
    expect(subscribe.subscribe).toHaveBeenCalledTimes(1);
  });
});
