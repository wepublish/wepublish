import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ArticleTemplateListDocument,
  DeleteArticleTemplateDocument,
} from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { TemplateList } from './templateList';

const templateListQueryMock = vi.fn();
const deleteTemplate = vi.fn();
const refetch = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('./testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: { ArticleTemplateList: options => templateListQueryMock(options) },
    mutations: { DeleteArticleTemplate: () => [deleteTemplate, {}] },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  PermissionControl: ({ children }: { children?: unknown }) => children,
}));

vi.mock(
  'react-i18next',
  async () => (await import('./testUtils')).translationMock
);

const template = (id: string, name: string) => ({
  __typename: 'ArticleTemplate',
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  blockTemplate: { __typename: 'BlockTemplate', id: `block-${id}`, name },
});

beforeEach(() => {
  vi.clearAllMocks();
  deleteTemplate.mockResolvedValue({});
  templateListQueryMock.mockReturnValue({
    data: {
      articleTemplates: {
        nodes: [template('template-1', 'News'), template('template-2', '')],
        totalCount: 2,
      },
    },
    loading: false,
    refetch,
  });
});

function CurrentLocation() {
  const { pathname, search } = useLocation();

  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

const theme = createTheme({ cssVariables: true });

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/things/templates']}>
        <Routes>
          <Route
            path="/things/templates"
            element={
              <TemplateList
                listDocument={ArticleTemplateListDocument}
                deleteDocument={DeleteArticleTemplateDocument}
                selectTemplates={data => data?.articleTemplates}
                basePath="/things/templates"
                permissions={{ create: 'CREATE', delete: 'DELETE' }}
                i18nPrefix="thingTemplates"
              />
            }
          />
          <Route
            path="*"
            element={<CurrentLocation />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('TemplateList', () => {
  it('should list the templates and link to them', async () => {
    renderList();

    expect(templateListQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { take: 10, skip: 0 } })
    );
    expect(await screen.findByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/things/templates/edit/template-1'
    );
    expect(
      screen.getByRole('link', { name: 'thingTemplates.list.noName' })
    ).toHaveAttribute('href', '/things/templates/edit/template-2');
    expect(
      screen.getByRole('link', { name: /thingTemplates.list.newTemplate/ })
    ).toHaveAttribute('href', '/things/templates/create');
    expect(screen.getByText('thingTemplates.list.title')).toBeInTheDocument();
  });

  it('should give the name most of the row and keep the actions compact', async () => {
    renderList();

    const table = (await screen.findByRole('link', { name: 'News' })).closest(
      'table'
    );

    expect(table?.style.getPropertyValue('--col-name-size')).toBe('240px');
    expect(table?.style.getPropertyValue('--col-action-size')).toBe('100px');
  });

  it('should open a copy of a template', async () => {
    renderList();

    const [copyButton] = await screen.findAllByRole('button', {
      name: 'thingTemplates.list.copy',
    });
    fireEvent.click(copyButton);

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/things/templates/create?copyFrom=template-1'
    );
  });

  it('should delete a template', async () => {
    renderList();

    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'delete' }))[0]
    );

    expect(
      screen.getByText('thingTemplates.delete.body:News')
    ).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'confirm' }));

    await waitFor(() =>
      expect(deleteTemplate).toHaveBeenCalledWith({
        variables: { id: 'template-1' },
      })
    );
    expect(refetch).toHaveBeenCalled();
  });
});
