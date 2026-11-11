import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { PollEditView } from './pollEditView';

const poll = {
  id: 'poll-1',
  question: 'To be?',
  opensAt: '2026-09-30T10:00:00.000Z',
  closedAt: null,
  infoText: [],
  answers: [],
  externalVoteSources: [],
};

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({
    query: async () => ({ data: { poll } }),
  }),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  SingleViewTitle: () => null,
  PollAnswers: () => null,
  PollExternalVotes: () => null,
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={['/polls/edit/poll-1']}>
        <Routes>
          <Route
            path="/polls/edit/:id"
            element={<PollEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('PollEditView', () => {
  it('labels the opening and closing date pickers with their visible labels', async () => {
    renderView();

    expect(
      await screen.findByRole('textbox', {
        name: 'pollEditView.opensAtLabel',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'pollEditView.closesAtLabel' })
    ).toBeTruthy();
  });

  it('labels the info text editor with its visible label', async () => {
    renderView();

    expect(
      await screen.findByRole('textbox', { name: 'pollEditView.infoText' })
    ).toBeTruthy();
  });
});
