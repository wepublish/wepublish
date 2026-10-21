import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleTeaser,
  mockTag,
  mockTeaserListBlock,
  mockTeaserSlotsBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { BlockRenderer } from '../../blocks';

const renderBlock = (block: FullBlockFragment) =>
  renderWithProviders(
    <BlockRenderer
      block={block}
      index={0}
      count={1}
      type="Page"
    />
  );

const mainTag = mockTag({ main: true, url: 'https://example.com/t/main' });

const titledTeasers = (...titles: string[]) =>
  titles.map(title =>
    mockArticleTeaser({
      title,
      article: mockArticle({
        tags: [mainTag, mockTag()],
        latest: mockArticleRevision({ blocks: [] }),
      }),
    })
  );

describe('Focus block style', () => {
  it('focuses the first teaser and lists the rest below it', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Focus',
        title: 'Foobar Title',
        teasers: titledTeasers('Focused', 'Second', 'Third'),
      })
    );

    expect(
      screen
        .getAllByRole('heading', { level: 1 })
        .map(heading => heading.textContent)
    ).toEqual(['Foobar Title', 'Focused', 'Second', 'Third']);
  });

  it('shows the title without a link when the list is not filtered by tag', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Focus',
        title: 'Foobar Title',
        teasers: titledTeasers('Focused'),
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Foobar Title' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Foobar Title' })
    ).not.toBeInTheDocument();
  });

  it('links the title to the tag the list is filtered by', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Focus',
        title: 'Foobar Title',
        teasers: titledTeasers('Focused'),
        filter: { __typename: 'TeaserListBlockFilter', tags: [mainTag.id] },
      })
    );

    expect(screen.getByRole('link', { name: 'Foobar Title' })).toHaveAttribute(
      'href',
      'https://example.com/t/main'
    );
  });

  it('does not link the title when the focused teaser lacks the filtered tag', () => {
    renderBlock(
      mockTeaserListBlock({
        blockStyle: 'Focus',
        title: 'Foobar Title',
        teasers: titledTeasers('Focused'),
        filter: { __typename: 'TeaserListBlockFilter', tags: ['other-tag'] },
      })
    );

    expect(
      screen.queryByRole('link', { name: 'Foobar Title' })
    ).not.toBeInTheDocument();
  });

  it('applies to teaser slots too, without linking the title', () => {
    renderBlock(
      mockTeaserSlotsBlock({
        blockStyle: 'Focus',
        title: 'Foobar Title',
        teasers: titledTeasers('Focused', 'Second'),
      })
    );

    expect(
      screen
        .getAllByRole('heading', { level: 1 })
        .map(heading => heading.textContent)
    ).toEqual(['Foobar Title', 'Focused', 'Second']);
    expect(
      screen.queryByRole('link', { name: 'Foobar Title' })
    ).not.toBeInTheDocument();
  });
});
