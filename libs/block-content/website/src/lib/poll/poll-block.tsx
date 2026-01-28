import styled from '@emotion/styled';
import { useUser } from '@wepublish/authentication/website';
import {
  BlockContent,
  PollBlock as PollBlockType,
  PollVoteMutationResult,
  UserPollVoteQueryResult,
} from '@wepublish/website/api';
import {
  BuilderPollBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useMemo, useState } from 'react';
import { PollBlockResult } from './poll-block-result';
import { usePollBlock } from './poll-block.context';
import { H4 } from '@wepublish/ui';

export const isPollBlock = (
  block: Pick<BlockContent, '__typename'>
): block is PollBlockType => block.__typename === 'PollBlock';

export const PollBlockWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const PollBlockTitle = styled(H4)``;

export const PollBlockVoting = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

export const PollBlockVoteResultList = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const PollBlockMeta = styled('div')`
  font-size: 0.875em;
  color: ${({ theme }) => theme.palette.text.disabled};
`;

export const PollBlock = ({ poll, className }: BuilderPollBlockProps) => {
  const { vote, fetchUserVote, canVoteAnonymously, getAnonymousVote } =
    usePollBlock();

  const [voteResult, setVoteResult] = useState<
    Pick<PollVoteMutationResult, 'loading' | 'data' | 'error'>
  >({
    loading: false,
  });
  const [loggedInVote, setLoggedInVote] = useState<
    Pick<UserPollVoteQueryResult, 'loading' | 'data' | 'error'>
  >({
    data: undefined,
    loading: true,
  });

  const { hasUser } = useUser();
  const {
    elements: { Button, H4, Alert },
    blocks: { RichText },
    date,
  } = useWebsiteBuilder();

  const combinedVotes = useMemo(() => {
    const total: Record<string, number> = {};

    if (!poll) {
      return total;
    }

    for (const answer of poll.answers) {
      total[answer.id] = total[answer.id] ?? 0;
      total[answer.id] += answer.votes;
    }

    for (const voteSource of poll.externalVoteSources) {
      for (const vote of voteSource.voteAmounts) {
        total[vote.answerId] = total[vote.answerId] ?? 0;
        total[vote.answerId] += vote.amount;
      }
    }

    if (voteResult?.data?.voteOnPoll?.answerId) {
      total[voteResult.data.voteOnPoll.answerId]++;
    }

    return total;
  }, [poll, voteResult?.data?.voteOnPoll?.answerId]);

  const totalVotes = useMemo(
    () =>
      Object.values(combinedVotes).reduce((total, curr) => (total += curr), 0),
    [combinedVotes]
  );

  useEffect(() => {
    if (hasUser && poll) {
      fetchUserVote({
        variables: {
          pollId: poll.id,
        },
      }).then(setLoggedInVote);
    }
  }, [fetchUserVote, poll, hasUser]);

  if (!poll) {
    return null;
  }

  const isOpen = !poll.closedAt || new Date(poll.closedAt) > new Date();
  const canVote = (canVoteAnonymously || hasUser) && isOpen;
  const userVote =
    voteResult?.data?.voteOnPoll?.answerId ??
    loggedInVote?.data?.userPollVote ??
    (canVoteAnonymously ? getAnonymousVote(poll.id) : undefined);
  const hasVoted = !!(
    loggedInVote?.data?.userPollVote ??
    voteResult?.data?.voteOnPoll ??
    (canVoteAnonymously && getAnonymousVote(poll.id))
  );

  return (
    <PollBlockWrapper className={className}>
      {poll.question && (
        <PollBlockTitle component={'h1'}>{poll.question}</PollBlockTitle>
      )}
      {poll.infoText && <RichText richText={poll.infoText} />}

      {loggedInVote.error && (
        <Alert severity="error">{loggedInVote.error.message}</Alert>
      )}
      {voteResult.error && (
        <Alert severity="error">{voteResult.error.message}</Alert>
      )}

      {!hasVoted && canVote && (
        <PollBlockVoting>
          {poll.answers.map(answer => (
            <Button
              variant="outlined"
              color="primary"
              key={answer.id}
              disabled={voteResult.loading}
              onClick={async () => {
                setVoteResult({
                  loading: true,
                });

                const result = await vote(
                  {
                    variables: {
                      answerId: answer.id,
                    },
                  },
                  poll?.id
                );

                setVoteResult({
                  ...result,
                  loading: false,
                });
              }}
            >
              {answer.answer}
            </Button>
          ))}
        </PollBlockVoting>
      )}

      {(hasVoted || !canVote) && (
        <PollBlockVoteResultList>
          {poll.answers.map(answer => (
            <PollBlockResult
              highlight={
                userVote ?
                  answer.id === userVote
                : combinedVotes[answer.id] > totalVotes / poll.answers.length
              }
              voteCount={combinedVotes[answer.id] ?? 0}
              answer={answer.answer}
              totalVotes={totalVotes}
              key={answer.id}
            />
          ))}
        </PollBlockVoteResultList>
      )}

      <PollBlockMeta>
        {totalVotes} Stimmen
        {poll.closedAt && isOpen && (
          <>
            {' '}
            &ndash; Schliesst am{' '}
            <time
              suppressHydrationWarning
              dateTime={poll.closedAt}
            >
              {date.format(new Date(poll.closedAt))}
            </time>
          </>
        )}
        {!isOpen && <> &ndash; Abstimmung beendet.</>}
      </PollBlockMeta>
    </PollBlockWrapper>
  );
};
