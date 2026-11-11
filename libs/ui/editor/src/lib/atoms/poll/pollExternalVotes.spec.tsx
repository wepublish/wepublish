import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { FullPollFragment } from '@wepublish/editor/api';

import { AddSource, ExternalVoteTable } from './pollExternalVotes';

vi.mock('@apollo/client/react', () => ({
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${Object.values(options).join(' ')}` : key,
  }),
}));

const poll = {
  id: 'poll-1',
  answers: [{ id: 'a1', answer: 'Yes', votes: 0 }],
  externalVoteSources: [
    {
      id: 's1',
      source: 'Facebook',
      voteAmounts: [{ id: 'v1', answerId: 'a1', amount: 4 }],
    },
  ],
} as unknown as FullPollFragment;

const theme = createTheme({ cssVariables: true });

describe('ExternalVoteTable', () => {
  it('names each vote field by answer and source and each delete button by source', () => {
    render(
      <ThemeProvider theme={theme}>
        <ExternalVoteTable
          poll={poll}
          loading={false}
          onPollChange={vi.fn()}
          onClickDeleteBtn={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('spinbutton', {
        name: 'pollExternalVotes.votesFor Yes Facebook',
      })
    ).toHaveValue(4);
    expect(
      screen.getByRole('button', {
        name: 'pollExternalVotes.deleteSource Facebook',
      })
    ).toBeTruthy();
  });
});

describe('AddSource', () => {
  it('names the new source field', () => {
    render(
      <ThemeProvider theme={theme}>
        <AddSource
          poll={poll}
          setLoading={vi.fn()}
          onPollChange={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', {
        name: 'pollExternalVotes.newSourcePlaceholder',
      })
    ).toBeTruthy();
  });
});
