import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { PollBlockValue } from '.';
import { PollBlock } from './pollBlock';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: {
      poll: {
        answers: [
          { id: 'red', answer: 'Red' },
          { id: 'blue', answer: 'Blue' },
        ],
      },
    },
  }),
}));

vi.mock('../atoms/poll/pollAnswerVoteUrl', () => ({
  usePollAnswerVoteUrl: () => (id: string) => `https://example.com/${id}`,
  CopyPollAnswerVoteUrlButton: () => <button>copy</button>,
}));

const renderBlock = (value: PollBlockValue) =>
  render(
    <ThemeProvider theme={theme}>
      <PollBlock
        type={EditorBlockType.Poll}
        value={value}
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('PollBlock', () => {
  it('spells out how to choose a poll when empty', () => {
    renderBlock({ poll: null } as unknown as PollBlockValue);

    expect(screen.getByText('blocks.poll.choosePoll')).toBeVisible();
  });

  it('shows the question and answers of the chosen poll', () => {
    renderBlock({
      poll: { id: 'poll-1', question: 'Which colour?' },
    } as unknown as PollBlockValue);

    expect(screen.getByText('Which colour?')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'blocks.poll.edit' })
    ).toBeInTheDocument();
  });

  it('puts the copy button before each answer', () => {
    renderBlock({
      poll: { id: 'poll-1', question: 'Which colour?' },
    } as unknown as PollBlockValue);

    const [first] = screen.getAllByRole('listitem');

    expect(first.firstElementChild).toBe(
      within(first).getByRole('button', { name: 'copy' })
    );
  });

  it('links to the chosen poll', () => {
    renderBlock({
      poll: { id: 'poll-1', question: 'Which colour?' },
    } as unknown as PollBlockValue);

    expect(
      screen.getByRole('link', { name: 'blocks.poll.open' })
    ).toHaveAttribute('href', '/polls/edit/poll-1');
  });
});
