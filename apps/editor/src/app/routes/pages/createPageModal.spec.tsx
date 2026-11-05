import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { CreatePageModal } from './createPageModal';

const pageTemplateListQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      PageTemplateList: options => pageTemplateListQueryMock(options),
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
  });
});

const renderModal = () =>
  render(
    <MemoryRouter initialEntries={['/pages']}>
      <CreatePageModal
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

describe('CreatePageModal', () => {
  it('should create a blank page', async () => {
    renderModal();

    expect(screen.getByText('pages.createModal.title')).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: /pages.createModal.blank/ })
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/pages\/create$/
    );
  });

  it('should create a page from a page template', async () => {
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: /News/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/pages/create?templateId=template-1'
    );
  });
});
