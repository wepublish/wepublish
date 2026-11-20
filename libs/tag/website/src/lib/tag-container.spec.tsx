import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockChallengeQuery,
  mockOperation,
  mockPage,
  mockPageRevision,
  mockPaginated,
  mockPrimaryBannerQuery,
  mockSettingListQuery,
  mockTag,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  ArticleListDocument,
  PageDocument,
  TagDocument,
  TagType,
} from '@wepublish/website/api';
import { BuilderTagProps } from '@wepublish/website/builder';
import { TagContainer } from './tag-container';

const tag = mockTag({ id: 'tag-id', tag: 'klima', type: TagType.Article });

describe('TagContainer', () => {
  it('loads the tag, then the articles filtered by its id', async () => {
    renderWithProviders(
      <TagContainer
        tag="klima"
        type={TagType.Article}
        variables={{ skip: 0, take: 5 }}
      />,
      {
        mocks: [
          mockOperation(TagDocument, {
            variables: { tag: 'klima', type: TagType.Article },
            data: { __typename: 'Query', tag },
          }),
          mockOperation(ArticleListDocument, {
            variables: { skip: 0, take: 5, filter: { tags: ['tag-id'] } },
            data: {
              __typename: 'Query',
              articles: mockPaginated('PaginatedArticles', [
                mockArticle({
                  latest: mockArticleRevision({ title: 'Climate article' }),
                }),
              ]),
            },
          }),
        ],
      }
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Klima' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Climate article' })
    ).toBeInTheDocument();
  });

  it('does not load any articles when the tag cannot be loaded', async () => {
    const FakeTag = vi.fn(({ tag: tagResult }: BuilderTagProps) =>
      tagResult.error ? <p>{tagResult.error.message}</p> : null
    );

    renderWithProviders(
      <TagContainer
        tag="unknown"
        type={TagType.Article}
      />,
      {
        builder: { Tag: FakeTag },
        mocks: [
          mockOperation(TagDocument, {
            variables: { tag: 'unknown', type: TagType.Article },
            errors: [{ message: 'Tag not found' }],
          }),
        ],
      }
    );

    expect(await screen.findByText('Tag not found')).toBeInTheDocument();
    expect(FakeTag.mock.lastCall?.[0].articles).toEqual(
      expect.objectContaining({ data: undefined, loading: false })
    );
  });

  it('renders the page chosen for the tag instead of its articles', async () => {
    const page = mockPage({
      id: 'page-id',
      latest: mockPageRevision({
        blocks: [mockTitleBlock({ title: 'Klima-Dossier' })],
      }),
    });

    renderWithProviders(
      <TagContainer
        tag="klima"
        type={TagType.Article}
        variables={{ skip: 0, take: 5 }}
      />,
      {
        // No ArticleListDocument mock: querying the articles fails the test.
        mocks: [
          mockOperation(TagDocument, {
            variables: { tag: 'klima', type: TagType.Article },
            data: { __typename: 'Query', tag: { ...tag, pageId: 'page-id' } },
          }),
          mockOperation(PageDocument, {
            variables: { id: 'page-id' },
            data: { __typename: 'Query', page },
          }),
          mockPrimaryBannerQuery(),
          mockSettingListQuery(),
          mockChallengeQuery(),
        ],
      }
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Klima-Dossier' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 1, name: 'Klima' })
    ).not.toBeInTheDocument();
  });
});
