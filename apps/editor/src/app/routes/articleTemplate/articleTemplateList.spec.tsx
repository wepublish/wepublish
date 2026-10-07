import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { ArticleTemplateList } from './articleTemplateList';

const useArticleTemplateListQuery = vi.fn();
const deleteArticleTemplate = vi.fn();
const refetch = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown, options?: unknown) =>
    operationName(document) === 'ArticleTemplateList' ?
      useArticleTemplateListQuery(options)
    : undefined,
  useMutation: (document: unknown) =>
    operationName(document) === 'DeleteArticleTemplate' ?
      [deleteArticleTemplate, {}]
    : [vi.fn(), {}],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const articleTemplate = (id: string, name: string) => ({
  __typename: 'ArticleTemplate',
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  blockTemplate: { __typename: 'BlockTemplate', id: `block-${id}`, name },
});

beforeEach(() => {
  vi.clearAllMocks();
  deleteArticleTemplate.mockResolvedValue({});
  useArticleTemplateListQuery.mockReturnValue({
    data: {
      articleTemplates: {
        nodes: [
          articleTemplate('template-1', 'News'),
          articleTemplate('template-2', 'Interview'),
        ],
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

const renderList = () =>
  render(
    <MemoryRouter initialEntries={['/articles/templates']}>
      <Routes>
        <Route
          path="/articles/templates"
          element={<ArticleTemplateList />}
        />
        <Route
          path="*"
          element={<CurrentLocation />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('ArticleTemplateList', () => {
  it('should list the article templates and link to them', async () => {
    renderList();

    expect(useArticleTemplateListQuery).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { take: 10, skip: 0 } })
    );
    expect(await screen.findByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/articles/templates/edit/template-1'
    );
    expect(screen.getByRole('link', { name: 'Interview' })).toHaveAttribute(
      'href',
      '/articles/templates/edit/template-2'
    );
    expect(
      screen.getByRole('link', {
        name: /articleTemplates.list.newArticleTemplate/,
      })
    ).toHaveAttribute('href', '/articles/templates/create');
  });

  it('should open a copy of an article template', async () => {
    renderList();

    const [copyButton] = await screen.findAllByRole('button', {
      name: 'articleTemplates.list.copy',
    });
    fireEvent.click(copyButton);

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/articles/templates/create?copyFrom=template-1'
    );
  });

  it('should delete an article template', async () => {
    renderList();

    fireEvent.click(
      (
        await screen.findAllByRole('button', {
          name: 'delete',
        })
      )[0]
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'confirm',
      })
    );

    await waitFor(() =>
      expect(deleteArticleTemplate).toHaveBeenCalledWith({
        variables: { id: 'template-1' },
      })
    );
    expect(refetch).toHaveBeenCalled();
  });
});
