import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CommentEditView } from './commentEditView';

const comment = {
  id: 'comment-1',
  itemID: 'article-1',
  itemType: 'article',
  state: 'pendingApproval',
  featured: false,
  source: '',
  tags: [],
  overriddenRatings: [],
  revisions: [],
  user: null,
  guestUsername: null,
  guestUserImage: null,
};

const operationName = (document: unknown) =>
  (
    document as {
      definitions?: { kind: string; name?: { value: string } }[];
    }
  )?.definitions?.find(definition => definition.kind === 'OperationDefinition')
    ?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (document: unknown) => {
    switch (operationName(document)) {
      case 'Comment':
        return { data: { comment }, loading: false };
      case 'RatingSystem':
        return {
          data: {
            ratingSystem: { answers: [{ id: 'answer-1', answer: 'Quality' }] },
          },
          loading: false,
        };
      default:
        return { loading: false };
    }
  },
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  SingleViewTitle: () => null,
  CommentHistory: () => null,
  CommentStateDropdown: () => null,
  CommentDeleteBtn: () => null,
  CommentUser: () => null,
  SelectTags: (props: { 'aria-labelledby'?: string }) => (
    <input
      role="combobox"
      aria-expanded="false"
      aria-controls="listbox"
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
      <MemoryRouter initialEntries={['/comments/edit/comment-1']}>
        <Routes>
          <Route
            path="/comments/edit/:id"
            element={<CommentEditView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('CommentEditView', () => {
  it('labels the tags, source and rating override fields with their visible labels', () => {
    renderView();

    expect(
      screen.getByRole('combobox', { name: 'commentEditView.tags' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'commentEditView.source' })
    ).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Quality' })).toBeTruthy();
  });
});
