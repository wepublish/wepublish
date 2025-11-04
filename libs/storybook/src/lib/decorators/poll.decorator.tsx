import { PollBlockContext } from '@wepublish/block-content/website';
import {
  PollVoteMutationResult,
  UserPollVoteQueryResult,
} from '@wepublish/website/api';
import { ComponentType } from 'react';
import { action } from '@storybook/addon-actions';

type PollDecoratorProps = Partial<{
  fetchUserVoteResult: Pick<UserPollVoteQueryResult, 'data' | 'error'>;
  voteResult: Pick<PollVoteMutationResult, 'data' | 'error'>;
  anonymousVoteResult: string;
  canVoteAnonymously: boolean;
}>;

export const WithPollBlockDecorators =
  ({
    anonymousVoteResult,
    canVoteAnonymously,
    fetchUserVoteResult,
    voteResult,
  }: PollDecoratorProps) =>
  (Story: ComponentType) => {
    const vote = async (args: unknown) => {
      action('vote')(args);

      return voteResult || {};
    };

    const fetchUserVote = async (args: unknown): Promise<any> => {
      action('fetchUserVote')(args);

      return fetchUserVoteResult || {};
    };

    const getAnonymousVote = (args: unknown): string | null => {
      action('getAnonymousVote')(args);

      return anonymousVoteResult ?? null;
    };

    return (
      <PollBlockContext.Provider
        value={{
          vote,
          fetchUserVote,
          canVoteAnonymously,
          getAnonymousVote,
        }}
      >
        <Story />
      </PollBlockContext.Provider>
    );
  };
