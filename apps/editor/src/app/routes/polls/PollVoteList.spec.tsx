import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PollVoteList } from './PollVoteList';

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useTableExportQuery: () => undefined,
  ListFilters: () => null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.['date'] ? `${key}:${options['date']}` : key,
    i18n: { language: 'en' },
  }),
}));

const createdAt = '2026-09-30T10:00:00.000Z';

const renderList = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <PollVoteList
          listQueryState={
            {
              filter: {},
              setFilter: vi.fn(),
              sortField: 'createdAt',
              setSortField: vi.fn(),
              sortOrder: 'desc',
              setSortOrder: vi.fn(),
              page: 1,
              setPage: vi.fn(),
              limit: 10,
              setLimit: vi.fn(),
            } as never
          }
          listQuery={
            {
              loading: false,
              variables: {},
              data: {
                pollVotes: {
                  totalCount: 1,
                  nodes: [
                    {
                      id: 'vote-1',
                      createdAt,
                      answer: { id: 'a', answer: 'Yes' },
                      userId: null,
                      fingerprint: 'abc',
                    },
                  ],
                },
              },
            } as never
          }
          pollQuery={{ data: { poll: { question: 'Q?' } } } as never}
          deleteItems={vi.fn()}
        />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('PollVoteList', () => {
  it('names the select-all and per-vote checkboxes', () => {
    renderList();

    expect(
      screen.getByRole('checkbox', { name: 'pollVoteList.selectAll' })
    ).toBeTruthy();

    const date = `${new Date(createdAt).toLocaleDateString()} ${new Date(
      createdAt
    ).toLocaleTimeString()}`;

    expect(
      screen.getByRole('checkbox', {
        name: `pollVoteList.selectVote:${date}`,
      })
    ).toBeTruthy();
  });
});
