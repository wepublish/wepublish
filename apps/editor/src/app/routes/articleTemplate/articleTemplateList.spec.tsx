import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ArticleTemplateList } from './articleTemplateList';

const articleTemplateListQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      ArticleTemplateList: options => articleTemplateListQueryMock(options),
    },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

beforeEach(() => {
  articleTemplateListQueryMock.mockReturnValue({
    data: {
      articleTemplates: {
        nodes: [
          {
            __typename: 'ArticleTemplate',
            id: 'template-1',
            blockTemplate: { __typename: 'BlockTemplate', name: 'News' },
          },
        ],
        totalCount: 1,
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('ArticleTemplateList', () => {
  it('should list article templates under the article routes', async () => {
    render(
      <MemoryRouter>
        <ArticleTemplateList />
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/articles/templates/edit/template-1'
    );
    expect(
      screen.getByRole('link', { name: /articleTemplates.list.newTemplate/ })
    ).toHaveAttribute('href', '/articles/templates/create');
    expect(screen.getByText('articleTemplates.list.title')).toBeInTheDocument();
  });
});
