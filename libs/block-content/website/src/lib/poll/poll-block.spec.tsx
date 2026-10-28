import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { Button, ThemeProvider } from '@mui/material';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  mockPoll,
  mockPollAnswer,
  mockPollBlock,
  mockSensitiveDataUser,
  createPollBlockContext,
  renderWithProviders,
  TestPollBlockOptions,
} from '@wepublish/mocks/website';
import { theme } from '@wepublish/ui';
import { FullPollFragment } from '@wepublish/website/api';
import { t } from 'i18next';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { PollBlock } from './poll-block';
import { PollBlockContext } from './poll-block.context';

const pollBlock = mockPollBlock({ poll: mockPoll({ closedAt: null }) });
const votedAnswerId = pollBlock.poll?.answers[1].id ?? null;

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.empty(),
});

const GuestWhoAlreadyVoted = () => (
  <ApolloProvider client={client}>
    <ThemeProvider theme={theme}>
      <WebsiteBuilderProvider elements={{ Button }}>
        <SessionTokenContext.Provider value={[null, false, vi.fn()]}>
          <PollBlockContext.Provider
            value={{
              canVoteAnonymously: true,
              getAnonymousVote: () => votedAnswerId,
              vote: async () => undefined,
            }}
          >
            <PollBlock {...pollBlock} />
          </PollBlockContext.Provider>
        </SessionTokenContext.Provider>
      </WebsiteBuilderProvider>
    </ThemeProvider>
  </ApolloProvider>
);

describe('Poll Block', () => {
  it('should hydrate without mismatch when a guest has already voted', async () => {
    const container = document.createElement('div');
    const onRecoverableError = vi.fn();

    container.innerHTML = renderToString(<GuestWhoAlreadyVoted />);
    document.body.appendChild(container);

    expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);

    const root = await act(async () =>
      hydrateRoot(container, <GuestWhoAlreadyVoted />, {
        onRecoverableError,
      })
    );

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button')).toHaveLength(0);

    act(() => root.unmount());
    container.remove();
  });
});

const pollId = 'poll-1';
const yes = mockPollAnswer({ id: 'yes', pollId, answer: 'Yes', votes: 30 });
const no = mockPollAnswer({ id: 'no', pollId, answer: 'No', votes: 10 });
const openPoll = mockPoll({
  id: pollId,
  question: 'Should the city build a new bridge?',
  answers: [yes, no],
  closedAt: null,
});
const totalVotes = yes.votes + no.votes;

const voteFor = (answerId: string) => ({
  data: {
    __typename: 'Mutation' as const,
    voteOnPoll: { __typename: 'PollVote' as const, answerId, pollId },
  },
});

const renderPoll = ({
  poll = openPoll,
  loggedIn = false,
  query,
  ...context
}: TestPollBlockOptions & {
  poll?: FullPollFragment | null;
  loggedIn?: boolean;
  query?: Record<string, string>;
} = {}) => {
  const pollContext = createPollBlockContext(context);
  const result = renderWithProviders(
    <PollBlock {...mockPollBlock({ poll })} />,
    {
      poll: pollContext,
      user: loggedIn ? mockSensitiveDataUser() : null,
      router: { query },
    }
  );

  return { ...result, pollContext };
};

describe('PollBlock', () => {
  it('shows the question and the results to guests who cannot vote', () => {
    renderPoll();

    expect(
      screen.getByRole('heading', { name: openPoll.question ?? '' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(
      screen.getByText(t('poll.totalVotes', { count: totalVotes }))
    ).toBeInTheDocument();
  });

  it('adds the votes of external sources to the results', () => {
    renderPoll({
      poll: mockPoll({
        ...openPoll,
        externalVoteSources: [
          {
            __typename: 'PollExternalVoteSource',
            id: 'newspaper',
            voteAmounts: [
              {
                __typename: 'PollExternalVote',
                id: 'newspaper-no',
                answerId: no.id,
                amount: 40,
              },
            ],
          },
        ],
      }),
    });

    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument();
    expect(
      screen.getByText(t('poll.totalVotes', { count: totalVotes + 40 }))
    ).toBeInTheDocument();
  });

  it('lets a logged in user vote and then shows the results', async () => {
    const user = userEvent.setup();
    const { pollContext } = renderPoll({
      loggedIn: true,
      fetchUserVoteResult: {
        data: { __typename: 'Query', userPollVote: null },
      },
      voteResult: voteFor(yes.id),
    });

    expect(pollContext.fetchUserVote).toHaveBeenCalledWith({
      variables: { pollId },
    });

    await user.click(await screen.findByRole('button', { name: 'Yes' }));

    expect(pollContext.vote).toHaveBeenCalledWith(
      { variables: { answerId: yes.id } },
      pollId
    );
    expect(
      await screen.findByText(t('poll.totalVotes', { count: totalVotes + 1 }))
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lets guests vote when anonymous voting is allowed', async () => {
    const user = userEvent.setup();
    const { pollContext } = renderPoll({
      canVoteAnonymously: true,
      voteResult: voteFor(no.id),
    });

    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(pollContext.vote).toHaveBeenCalledWith(
      { variables: { answerId: no.id } },
      pollId
    );
    expect(pollContext.fetchUserVote).not.toHaveBeenCalled();
    expect(
      await screen.findByText(t('poll.totalVotes', { count: totalVotes + 1 }))
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the results to a logged in user who already voted', async () => {
    renderPoll({
      loggedIn: true,
      fetchUserVoteResult: {
        data: { __typename: 'Query', userPollVote: no.id },
      },
    });

    await waitFor(() =>
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    );
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows the results to a guest who already voted anonymously', () => {
    const { pollContext } = renderPoll({
      canVoteAnonymously: true,
      anonymousVote: no.id,
    });

    expect(pollContext.getAnonymousVote).toHaveBeenCalledWith(pollId);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('shows when an open poll closes', () => {
    const closedAt = '2099-06-01T12:00:00.000Z';
    const { container } = renderPoll({
      poll: mockPoll({ ...openPoll, closedAt }),
    });

    expect(container.querySelector('time')).toHaveAttribute(
      'datetime',
      closedAt
    );
    expect(screen.queryByText(t('poll.closed'), { exact: false })).toBeNull();
  });

  it('does not allow voting on a closed poll', async () => {
    renderPoll({
      poll: mockPoll({ ...openPoll, closedAt: '2023-01-01T00:00:00.000Z' }),
      loggedIn: true,
      fetchUserVoteResult: {
        data: { __typename: 'Query', userPollVote: null },
      },
    });

    expect(
      await screen.findByText(t('poll.totalVotes', { count: totalVotes }), {
        exact: false,
      })
    ).toHaveTextContent(t('poll.closed'));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the error when the vote of the user cannot be loaded', async () => {
    renderPoll({
      loggedIn: true,
      fetchUserVoteResult: { error: new Error('Could not load your vote.') },
    });

    expect(
      await screen.findByText('Could not load your vote.')
    ).toBeInTheDocument();
  });

  it('shows the error when voting fails and lets the user retry', async () => {
    const user = userEvent.setup();

    renderPoll({
      loggedIn: true,
      fetchUserVoteResult: {
        data: { __typename: 'Query', userPollVote: null },
      },
      voteResult: { error: new Error('Could not save your vote.') },
    });

    await user.click(await screen.findByRole('button', { name: 'Yes' }));

    expect(
      await screen.findByText('Could not save your vote.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes' })).toBeEnabled();
  });

  it('votes for the answer given in the URL', async () => {
    const { pollContext } = renderPoll({
      loggedIn: true,
      fetchUserVoteResult: {
        data: { __typename: 'Query', userPollVote: null },
      },
      voteResult: voteFor(no.id),
      query: { answerId: no.id },
    });

    expect(
      await screen.findByText(t('poll.totalVotes', { count: totalVotes + 1 }))
    ).toBeInTheDocument();
    expect(pollContext.vote).toHaveBeenCalledWith(
      { variables: { answerId: no.id } },
      pollId
    );
  });

  it('ignores an answer in the URL that belongs to another poll', () => {
    const { pollContext } = renderPoll({
      canVoteAnonymously: true,
      query: { answerId: 'another-poll-answer' },
    });

    expect(pollContext.vote).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('renders nothing without a poll', () => {
    const { container } = renderPoll({ poll: null });

    expect(container).toBeEmptyDOMElement();
  });
});
