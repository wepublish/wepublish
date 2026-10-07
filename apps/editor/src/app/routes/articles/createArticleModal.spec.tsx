import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { CreateArticleModal } from './createArticleModal';

const useArticleTemplateListQuery = vi.fn();

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => ({
  ...((await importOriginal()) as object),
  useQuery: (document: unknown, options?: unknown) =>
    operationName(document) === 'ArticleTemplateList' ?
      useArticleTemplateListQuery(options)
    : undefined,
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

function CurrentLocation() {
  const { pathname, search } = useLocation();

  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

const renderModal = (onClose = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={['/articles']}>
      <CreateArticleModal
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
  });
});

describe('CreateArticleModal', () => {
  it('should offer a blank article and all article templates', async () => {
    renderModal();

    expect(useArticleTemplateListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { take: 100 },
        skip: false,
      })
    );
    expect(
      await screen.findByRole('button', {
        name: /articles.createModal.blankArticle/,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /News/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Interview/ })
    ).toBeInTheDocument();
  });

  it('should create a blank article', async () => {
    const onClose = vi.fn();
    renderModal(onClose);

    fireEvent.click(
      await screen.findByRole('button', {
        name: /articles.createModal.blankArticle/,
      })
    );

    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/articles\/create$/
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('should create an article from a template', async () => {
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: /Interview/ }));

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/articles/create?templateId=template-2'
    );
  });

  it('should not show a search bar if all templates fit', async () => {
    renderModal();

    await screen.findByRole('button', { name: /News/ });

    expect(
      screen.queryByPlaceholderText('articles.createModal.search')
    ).not.toBeInTheDocument();
  });

  describe('with more templates than fit', () => {
    let scrollHeight: PropertyDescriptor | undefined;
    let clientHeight: PropertyDescriptor | undefined;

    beforeEach(() => {
      scrollHeight = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'scrollHeight'
      );
      clientHeight = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'clientHeight'
      );

      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get: () => 1000,
      });
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get: () => 300,
      });
    });

    afterEach(() => {
      if (scrollHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollHeight',
          scrollHeight
        );
      }

      if (clientHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'clientHeight',
          clientHeight
        );
      }
    });

    it('should filter the templates by name', async () => {
      renderModal();

      const search = await screen.findByPlaceholderText(
        'articles.createModal.search'
      );

      fireEvent.change(search, { target: { value: 'inter' } });

      expect(
        screen.queryByRole('button', { name: /News/ })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Interview/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /articles.createModal.blankArticle/,
        })
      ).toBeInTheDocument();
    });

    it('should keep the search bar while searching', async () => {
      renderModal();

      const search = await screen.findByPlaceholderText(
        'articles.createModal.search'
      );

      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get: () => 100,
      });
      fireEvent.change(search, { target: { value: 'nothing matches' } });

      expect(
        screen.getByPlaceholderText('articles.createModal.search')
      ).toBeInTheDocument();
      expect(
        screen.getByText('articles.createModal.noResults')
      ).toBeInTheDocument();
    });
  });

  it('should keep the templates while the modal closes', async () => {
    const modal = (open: boolean) => (
      <MemoryRouter>
        <CreateArticleModal
          open={open}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    const { rerender } = render(modal(true));

    await screen.findByRole('button', { name: /News/ });
    rerender(modal(false));

    expect(useArticleTemplateListQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: false })
    );
  });

  it('should not load templates while closed', () => {
    render(
      <MemoryRouter>
        <CreateArticleModal
          open={false}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(useArticleTemplateListQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });
});
