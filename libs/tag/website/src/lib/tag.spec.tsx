import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockArticle,
  mockArticleRevision,
  mockPaginated,
  mockRichTextParagraph,
  mockTag,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  ArticleListQueryVariables,
  FullArticleFragment,
} from '@wepublish/website/api';
import { BuilderTagProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { ReactNode } from 'react';
import { Tag } from './tag';

vi.mock('next/head', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

const tag = mockTag({
  tag: 'klima',
  description: mockRichTextParagraph('Everything about the climate.'),
});

const articleTitled = (title: string) =>
  mockArticle({ latest: mockArticleRevision({ title }) });

const articlesResult = (
  articles: FullArticleFragment[] | null,
  totalCount = articles?.length ?? 0
): BuilderTagProps['articles'] => ({
  data:
    articles ?
      {
        __typename: 'Query',
        articles: mockPaginated('PaginatedArticles', articles, { totalCount }),
      }
    : undefined,
  loading: !articles,
  error: undefined,
});

const renderTag = ({
  articles = articlesResult([articleTitled('First article')]),
  variables = { skip: 0, take: 5 },
  tagData = tag,
}: {
  articles?: BuilderTagProps['articles'];
  variables?: ArticleListQueryVariables;
  tagData?: typeof tag | null;
} = {}) => {
  const onVariablesChange = vi.fn();

  const result = renderWithProviders(
    <Tag
      tag={{
        data: tagData ? { __typename: 'Query', tag: tagData } : undefined,
        loading: false,
        error: undefined,
      }}
      articles={articles}
      variables={variables}
      onVariablesChange={onVariablesChange}
    />
  );

  return { ...result, onVariablesChange, user: userEvent.setup() };
};

const canonicalLinks = () =>
  Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'),
    link => link.getAttribute('href')
  );

describe('Tag', () => {
  it('shows the capitalised tag as page heading with its description', () => {
    renderTag();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Klima' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Everything about the climate.')
    ).toBeInTheDocument();
  });

  it('lists the articles of the tag', () => {
    renderTag({
      articles: articlesResult([
        articleTitled('First article'),
        articleTitled('Second article'),
      ]),
    });

    expect(
      screen.getByRole('heading', { name: 'First article' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Second article' })
    ).toBeInTheDocument();
    expect(screen.queryByText(t('article.noArticles'))).not.toBeInTheDocument();
  });

  it('tells the reader when the tag has no articles', () => {
    renderTag({ articles: articlesResult([]) });

    expect(screen.getByText(t('article.noArticles'))).toBeInTheDocument();
  });

  it('does not claim there are no articles while they are loading', () => {
    renderTag({ articles: articlesResult(null) });

    expect(screen.queryByText(t('article.noArticles'))).not.toBeInTheDocument();
  });

  it('paginates by the page size and asks for the next page', async () => {
    const { user, onVariablesChange } = renderTag({
      articles: articlesResult([articleTitled('First article')], 11),
      variables: { skip: 0, take: 5 },
    });

    expect(
      screen.getByRole('button', { name: 'Go to page 3' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Go to page 4' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(onVariablesChange).toHaveBeenCalledWith({ skip: 5 });
  });

  it('marks the page that matches the current offset', () => {
    renderTag({
      articles: articlesResult([articleTitled('First article')], 11),
      variables: { skip: 5, take: 5 },
    });

    expect(screen.getByRole('button', { name: 'page 2' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('points the canonical link at the first tag page when paginated', () => {
    renderTag({
      articles: articlesResult([articleTitled('First article')], 11),
    });

    expect(canonicalLinks()).toContain('/a/tag/klima');
  });

  it('shows no pagination when all articles fit on one page', () => {
    renderTag({
      articles: articlesResult([articleTitled('First article')], 5),
    });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(canonicalLinks()).not.toContain('/a/tag/klima');
  });

  it('renders nothing while the tag is unknown', () => {
    const { container } = renderTag({ tagData: null });

    expect(container).toBeEmptyDOMElement();
  });
});
