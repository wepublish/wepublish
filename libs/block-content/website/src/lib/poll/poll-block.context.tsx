import {
  FetchResult,
  LazyQueryExecFunction,
  MutationFunctionOptions,
} from '@apollo/client';
import { useUser } from '@wepublish/authentication/website';
import {
  PollVoteMutation,
  PollVoteMutationVariables,
  UserPollVoteQuery,
  UserPollVoteQueryVariables,
} from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export type PollBlockContextProps = Partial<{
  canVoteAnonymously: boolean;
  getAnonymousVote: (pollId: string) => string | null;
  fetchUserVote: LazyQueryExecFunction<
    UserPollVoteQuery,
    UserPollVoteQueryVariables
  >;
  vote: (
    options: MutationFunctionOptions<
      PollVoteMutation,
      PollVoteMutationVariables
    >,
    pollId: string
  ) => Promise<FetchResult<PollVoteMutation> | undefined>;
}>;

export const PollBlockContext = createContext<PollBlockContextProps>({});

export const usePollBlock = () => {
  const { hasUser } = useUser();
  const { fetchUserVote, vote, canVoteAnonymously, getAnonymousVote } =
    useContext(PollBlockContext);

  if (hasUser && !fetchUserVote) {
    throw new Error('PollBlockContext has not been fully provided.');
  }

  if (!hasUser && canVoteAnonymously && !getAnonymousVote) {
    throw new Error('PollBlockContext has not been fully provided.');
  }

  if ((hasUser || canVoteAnonymously) && !vote) {
    throw new Error('PollBlockContext has not been fully provided.');
  }

  return {
    fetchUserVote: fetchUserVote!,
    vote: vote!,
    canVoteAnonymously,
    getAnonymousVote: getAnonymousVote!,
  };
};
