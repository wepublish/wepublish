import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { CreateArticleModal } from './createArticleModal';

const articleTemplateListQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      ArticleTemplateList: options => articleTemplateListQueryMock(options),
    },
  });
});

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

function CurrentLocation() {
  const { pathname, search } = useLocation();

  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

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
  });
});

const renderModal = () =>
  render(
    <MemoryRouter initialEntries={['/articles']}>
      <CreateArticleModal
        open
        onClose={vi.fn()}
      />
      <Routes>
        <Route
          path="*"
          element={<CurrentLocation />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('CreateArticleModal', () => {
  it('should create a blank article', async () => {
    renderModal();

    expect(screen.getByText('articles.createModal.title')).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: /articles.createModal.blank/ })
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/articles\/create$/
    );
  });

  it('should create an article from an article template', async () => {
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: /News/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/articles/create?templateId=template-1'
    );
  });
});
