import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { DocumentList } from './documentList';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: unknown }) => children,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const documents = [
  {
    id: 'doc-1',
    title: 'Annual report',
    filename: 'report',
    extension: '.pdf',
    fileSize: 1000,
    url: 'https://example.com/report.pdf',
    thumbnailURL: 'https://example.com/report.png',
  },
  {
    id: 'doc-2',
    title: 'Budget',
    filename: 'budget',
    extension: '.pdf',
    fileSize: 1000,
    url: 'https://example.com/budget.pdf',
    thumbnailURL: null,
  },
];

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { documents: { nodes: documents, totalCount: 2 } },
    loading: false,
    refetch: vi.fn(),
  });
});

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/documents"
            element={<DocumentList />}
          />
          <Route
            path="/documents/upload"
            element={<DocumentList />}
          />
          <Route
            path="/documents/edit/:id"
            element={<DocumentList />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('DocumentList accessibility', () => {
  it('gives every preview link a name, with or without a thumbnail', () => {
    renderAt('/documents');

    const table = screen.getByRole('table');

    expect(
      within(table).getAllByRole('link', { name: 'Annual report' })
    ).toHaveLength(2);
    expect(within(table).getAllByRole('link', { name: 'Budget' })).toHaveLength(
      2
    );
  });

  it('renders the open-link action as a single link, not a button inside a link', () => {
    renderAt('/documents');

    const open = screen.getAllByRole('link', {
      name: 'documents.overview.openLink',
    });

    expect(open).toHaveLength(2);
    expect(within(open[0]).queryByRole('button')).toBeNull();
  });
});
