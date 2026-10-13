import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { ArticleTemplateListDocument } from '@wepublish/editor/api';

import { CreateFromTemplateModal } from './createFromTemplateModal';

const articleTemplateListQueryMock = vi.fn();

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('./testUtils');

  return routeApolloByOperation(await importOriginal(), {
    queries: {
      ArticleTemplateList: options => articleTemplateListQueryMock(options),
    },
  });
});

vi.mock(
  'react-i18next',
  async () => (await import('./testUtils')).translationMock
);

const articleTemplate = (id: string, name: string) => ({
  __typename: 'ArticleTemplate',
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  blockTemplate: { __typename: 'BlockTemplate', id: `block-${id}`, name },
});

const mockTemplates = (count: number) =>
  articleTemplateListQueryMock.mockReturnValue({
    data: {
      articleTemplates: {
        nodes: Array.from({ length: count }, (_, index) =>
          articleTemplate(`template-${index + 1}`, `Template ${index + 1}`)
        ),
        totalCount: count,
      },
    },
    loading: false,
  });

function CurrentLocation() {
  const { pathname, search } = useLocation();

  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={['/things']}>
      <CreateFromTemplateModal
        listDocument={ArticleTemplateListDocument}
        selectTemplates={data => data?.articleTemplates.nodes}
        createPath="/things/create"
        i18nPrefix="things.createModal"
        open
        onClose={onClose}
      />
      <Routes>
        <Route
          path="*"
          element={<CurrentLocation />}
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  articleTemplateListQueryMock.mockReturnValue({
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
  });
});

describe('CreateFromTemplateModal', () => {
  it('should offer a blank document and all templates', async () => {
    renderModal();

    expect(articleTemplateListQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { take: 100 },
        skip: false,
      })
    );
    expect(
      await screen.findByRole('button', {
        name: /things.createModal.blank/,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /News/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Interview/ })
    ).toBeInTheDocument();
  });

  it('should create a blank document', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /things.createModal.blank/,
      })
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/things\/create$/
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('should create a document from a template', async () => {
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: /Interview/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/things/create?templateId=template-2'
    );
  });

  it('should not show a search bar for up to 5 templates', async () => {
    mockTemplates(5);
    renderModal();

    await screen.findByRole('button', { name: /Template 5/ });

    expect(
      screen.queryByPlaceholderText('things.createModal.search')
    ).not.toBeInTheDocument();
  });

  describe('with more than 5 templates', () => {
    beforeEach(() => {
      mockTemplates(6);
    });

    it('should filter the templates by name', async () => {
      renderModal();

      const search = await screen.findByPlaceholderText(
        'things.createModal.search'
      );

      fireEvent.change(search, { target: { value: 'template 6' } });

      expect(
        screen.queryByRole('button', { name: /Template 1/ })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Template 6/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /things.createModal.blank/,
        })
      ).toBeInTheDocument();
    });

    it('should keep the search bar while searching', async () => {
      renderModal();

      const search = await screen.findByPlaceholderText(
        'things.createModal.search'
      );

      fireEvent.change(search, { target: { value: 'nothing matches' } });

      expect(
        screen.getByPlaceholderText('things.createModal.search')
      ).toBeInTheDocument();
      expect(
        screen.getByText('things.createModal.noResults')
      ).toBeInTheDocument();
    });
  });

  it('should keep the templates while the modal closes', async () => {
    const modal = (open: boolean) => (
      <MemoryRouter>
        <CreateFromTemplateModal
          listDocument={ArticleTemplateListDocument}
          selectTemplates={data => data?.articleTemplates.nodes}
          createPath="/things/create"
          i18nPrefix="things.createModal"
          open={open}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    const { rerender } = render(modal(true));

    await screen.findByRole('button', { name: /News/ });
    rerender(modal(false));

    expect(articleTemplateListQueryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: false })
    );
  });

  it('should not load templates while closed', () => {
    render(
      <MemoryRouter>
        <CreateFromTemplateModal
          listDocument={ArticleTemplateListDocument}
          selectTemplates={data => data?.articleTemplates.nodes}
          createPath="/things/create"
          i18nPrefix="things.createModal"
          open={false}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(articleTemplateListQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });
});
