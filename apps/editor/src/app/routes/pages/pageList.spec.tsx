import { useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommentItemType, CreateCommentDocument } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { PageList } from './pageList';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, ReturnType<typeof vi.fn>>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as ReturnType<typeof vi.fn>;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: () => [vi.fn(), { data: undefined }],
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const page = {
  __typename: 'Page',
  id: 'page-1',
  url: 'https://example.com/about',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-09-28T15:30:00.000Z',
  draft: null,
  pending: null,
  published: null,
  latest: {
    __typename: 'PageRevision',
    id: 'revision-1',
    title: 'About us',
    description: null,
    slug: 'about',
    createdAt: '2026-09-28T15:30:00.000Z',
    publishedAt: null,
    image: null,
    properties: [],
    tags: [],
  },
  tags: [],
};

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: {
      pages: {
        nodes: [page],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
    },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('PageList', () => {
  it('creates comments for a page as page comments', () => {
    render(
      <MemoryRouter>
        <PageList />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'pageEditor.overview.createComment' })
    );

    expect(mutationFor(CreateCommentDocument)).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { itemID: 'page-1', itemType: CommentItemType.Page },
      })
    );
  });
});
