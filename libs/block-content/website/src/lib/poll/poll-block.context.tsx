import { ApolloClient } from '@apollo/client';
import type { useLazyQuery, useMutation } from '@apollo/client/react';
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
  fetchUserVote: useLazyQuery.ExecFunction<
    UserPollVoteQuery,
    UserPollVoteQueryVariables
  >;
  vote: (
    options: Parameters<
      useMutation.MutationFunction<PollVoteMutation, PollVoteMutationVariables>
    >[0],
    pollId: string
  ) => Promise<ApolloClient.MutateResult<PollVoteMutation> | undefined>;
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
