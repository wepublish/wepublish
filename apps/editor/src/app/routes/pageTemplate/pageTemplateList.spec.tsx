import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PageTemplateList } from './pageTemplateList';

const pageTemplateListQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      PageTemplateList: options => pageTemplateListQueryMock(options),
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
  pageTemplateListQueryMock.mockReturnValue({
    data: {
      pageTemplates: {
        nodes: [
          {
            __typename: 'PageTemplate',
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

describe('PageTemplateList', () => {
  it('should list page templates under the page routes', async () => {
    render(
      <MemoryRouter>
        <PageTemplateList />
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/pages/templates/edit/template-1'
    );
    expect(
      screen.getByRole('link', { name: /pageTemplates.list.newTemplate/ })
    ).toHaveAttribute('href', '/pages/templates/create');
    expect(screen.getByText('pageTemplates.list.title')).toBeInTheDocument();
  });
});
