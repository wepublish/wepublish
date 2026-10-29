import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockArticleTeaser,
  mockAuthor,
  mockCustomTeaser,
  mockEvent,
  mockEventTeaser,
  mockFlexAlignment,
  mockImage,
  mockPage,
  mockPageRevision,
  mockPageTeaser,
  mockRichTextParagraph,
  mockTag,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import { t } from 'i18next';

import {
  BaseTeaser,
  selectTeaserAuthors,
  selectTeaserAuthorsWithRole,
} from './base-teaser';

const renderTeaser = (teaser: FullTeaserFragment) =>
  renderWithProviders(
    <BaseTeaser
      teaser={teaser}
      alignment={mockFlexAlignment({ x: 0, y: 0, w: 3, h: 4 })}
      index={0}
      blockStyle={null}
    />
  );

const teaserLabel = ({
  title = '',
  lead = '',
  authors = '',
}: {
  title?: string;
  lead?: string;
  authors?: string;
}) =>
  t('teaser.ariaLabel', {
    hasTitle: !!title,
    title,
    hasLead: !!lead,
    lead,
    hasAuthors: !!authors,
    authors,
  }).trim();

const teaserImage = mockImage({ description: 'Teaser image' });
const contentImage = mockImage({ description: 'Content image' });

describe('BaseTeaser', () => {
  describe('article teaser', () => {
    const articleWithAuthors = () =>
      mockArticle({
        url: 'https://example.com/a/article',
        latest: mockArticleRevision({
          blocks: [],
          image: contentImage,
          authors: [
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'Jane Doe' }),
              role: 'Text',
            }),
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'John Doe' }),
            }),
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'Hidden Author', hideOnTeaser: true }),
            }),
          ],
        }),
      });

    it('links to the article, labelled with title, lead and the visible authors', () => {
      renderTeaser(mockArticleTeaser({ article: articleWithAuthors() }));

      expect(
        screen.getByRole('link', {
          name: teaserLabel({
            title: 'This is a title',
            lead: 'This is a lead',
            authors: 'Jane Doe (Text), John Doe',
          }),
        })
      ).toHaveAttribute('href', 'https://example.com/a/article');
    });

    it('shows the teaser pre-title, title, lead and image', () => {
      renderTeaser(
        mockArticleTeaser({
          image: teaserImage,
          article: articleWithAuthors(),
        })
      );

      expect(screen.getByText('This is a pretitle')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'This is a title' })
      ).toBeInTheDocument();
      expect(screen.getByText('This is a lead')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Teaser image' })
      ).toBeInTheDocument();
    });

    it('lists the visible authors with their roles', () => {
      renderTeaser(mockArticleTeaser({ article: articleWithAuthors() }));

      expect(
        screen.getByText(
          t('teaser.author.text', { authors: 'Jane Doe (Text), John Doe' })
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/Hidden Author/)).not.toBeInTheDocument();
    });

    it('shows the publication date', () => {
      const { container } = renderTeaser(mockArticleTeaser());

      expect(container.querySelector('time')).toHaveAttribute(
        'datetime',
        '2023-01-01T00:00:00.000Z'
      );
    });

    it('mentions the update when the latest revision was published days later', () => {
      renderTeaser(
        mockArticleTeaser({
          article: mockArticle({
            publishedAt: '2023-01-01T00:00:00.000Z',
            latest: mockArticleRevision({
              blocks: [],
              publishedAt: '2023-01-05T00:00:00.000Z',
            }),
          }),
        })
      );

      expect(screen.getByText(/Aktualisiert am/)).toBeInTheDocument();
    });

    it('does not mention an update made on the day of publication', () => {
      renderTeaser(mockArticleTeaser());

      expect(screen.queryByText(/Aktualisiert am/)).not.toBeInTheDocument();
    });

    it('shows no date when the article is unpublished', () => {
      const { container } = renderTeaser(
        mockArticleTeaser({
          article: mockArticle({
            publishedAt: null,
            latest: mockArticleRevision({ blocks: [] }),
          }),
        })
      );

      expect(container.querySelector('time')).toBeNull();
    });

    it('falls back to the pre-title, title, lead and image of the article', () => {
      renderTeaser(
        mockArticleTeaser({
          preTitle: null,
          title: null,
          lead: null,
          image: null,
          article: mockArticle({
            latest: mockArticleRevision({ blocks: [], image: contentImage }),
          }),
        })
      );

      expect(
        screen.getByText('This is an article pretitle')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'This is an article title',
        })
      ).toBeInTheDocument();
      expect(screen.getByText('This is an article lead')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Content image' })
      ).toBeInTheDocument();
    });

    it('falls back to the main tag when neither teaser nor article has a pre-title', () => {
      renderTeaser(
        mockArticleTeaser({
          preTitle: null,
          article: mockArticle({
            tags: [
              mockTag({ tag: 'Side Tag' }),
              mockTag({ tag: 'Main Tag', main: true }),
            ],
            latest: mockArticleRevision({ preTitle: null, blocks: [] }),
          }),
        })
      );

      expect(screen.getByText('Main Tag')).toBeInTheDocument();
      expect(screen.queryByText('Side Tag')).not.toBeInTheDocument();
    });

    it('shows no image when neither teaser nor article has one', () => {
      const { container } = renderTeaser(
        mockArticleTeaser({
          image: null,
          article: mockArticle({
            latest: mockArticleRevision({ image: null, blocks: [] }),
          }),
        })
      );

      expect(container.querySelector('img')).toBeNull();
    });

    it('leaves lead and authors out of the label when there are none', () => {
      renderTeaser(
        mockArticleTeaser({
          lead: null,
          article: mockArticle({
            latest: mockArticleRevision({
              lead: null,
              authors: [],
              blocks: [],
            }),
          }),
        })
      );

      expect(
        screen.getByRole('link', {
          name: teaserLabel({ title: 'This is a title' }),
        })
      ).toBeInTheDocument();
    });

    it('hides all authors when the article hides its authors', () => {
      renderTeaser(
        mockArticleTeaser({
          article: mockArticle({
            latest: mockArticleRevision({
              blocks: [],
              hideAuthor: true,
              authors: [
                mockArticleRevisionAuthor({
                  author: mockAuthor({ name: 'Jane Doe' }),
                }),
              ],
            }),
          }),
        })
      );

      expect(screen.queryByText(/Jane Doe/)).not.toBeInTheDocument();
    });
  });

  describe('page teaser', () => {
    it('links to the page and shows pre-title, title and lead', () => {
      renderTeaser(
        mockPageTeaser({
          page: mockPage({
            url: 'https://example.com/about',
            latest: mockPageRevision({ blocks: [] }),
          }),
        })
      );

      expect(
        screen.getByRole('link', {
          name: teaserLabel({
            title: 'This is a title',
            lead: 'This is a lead',
          }),
        })
      ).toHaveAttribute('href', 'https://example.com/about');
      expect(screen.getByText('This is a pretitle')).toBeInTheDocument();
    });

    it('falls back to the title, description and image of the page', () => {
      renderTeaser(
        mockPageTeaser({
          title: null,
          lead: null,
          image: null,
          page: mockPage({
            latest: mockPageRevision({ blocks: [], image: contentImage }),
          }),
        })
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'This is a page title' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('This is a page description')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Content image' })
      ).toBeInTheDocument();
    });

    it('falls back to the main tag as pre-title', () => {
      renderTeaser(
        mockPageTeaser({
          preTitle: null,
          page: mockPage({
            latest: mockPageRevision({ blocks: [] }),
            tags: [
              mockTag({ tag: 'Secondary Tag' }),
              mockTag({ tag: 'Main Tag', main: true }),
            ],
          }),
        })
      );

      expect(screen.getByText('Main Tag')).toBeInTheDocument();
      expect(screen.queryByText('Secondary Tag')).not.toBeInTheDocument();
    });

    it('shows no image when neither teaser nor page has one', () => {
      const { container } = renderTeaser(
        mockPageTeaser({
          image: null,
          page: mockPage({
            latest: mockPageRevision({ image: null, blocks: [] }),
          }),
        })
      );

      expect(container.querySelector('img')).toBeNull();
    });
  });

  describe('event teaser', () => {
    it('links to the event and shows its start date', () => {
      const { container } = renderTeaser(
        mockEventTeaser({
          event: mockEvent({
            url: 'https://example.com/event/concert',
            startsAt: '2024-05-04T18:00:00.000Z',
          }),
        })
      );

      expect(
        screen.getByRole('link', {
          name: teaserLabel({
            title: 'This is a title',
            lead: 'This is a lead',
          }),
        })
      ).toHaveAttribute('href', 'https://example.com/event/concert');
      expect(container.querySelector('time')).toHaveAttribute(
        'datetime',
        '2024-05-04T18:00:00.000Z'
      );
    });

    it('falls back to the event name, lead and image', () => {
      renderTeaser(
        mockEventTeaser({
          title: null,
          lead: null,
          image: null,
          event: mockEvent({ lead: 'Event lead', image: contentImage }),
        })
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Cool concert' })
      ).toBeInTheDocument();
      expect(screen.getByText('Event lead')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Content image' })
      ).toBeInTheDocument();
    });

    it('uses the first 225 characters of the description when there is no lead', () => {
      const description = 'A'.repeat(300);

      renderTeaser(
        mockEventTeaser({
          lead: null,
          event: mockEvent({
            lead: null,
            description: mockRichTextParagraph(description),
          }),
        })
      );

      expect(
        screen.getByText(description.substring(0, 225))
      ).toBeInTheDocument();
    });

    it('shows no lead when the event has neither lead nor description', () => {
      renderTeaser(
        mockEventTeaser({
          lead: null,
          event: mockEvent({ lead: null, description: null }),
        })
      );

      expect(
        screen.getByRole('link', {
          name: teaserLabel({ title: 'This is a title' }),
        })
      ).toBeInTheDocument();
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });

    it('shows neither pre-title nor image when teaser and event have none', () => {
      const { container } = renderTeaser(
        mockEventTeaser({
          preTitle: null,
          image: null,
          event: mockEvent({ image: null }),
        })
      );

      expect(screen.queryByText('This is a pretitle')).not.toBeInTheDocument();
      expect(container.querySelector('img')).toBeNull();
    });
  });

  describe('custom teaser', () => {
    it('links to the content url in the same tab by default', () => {
      renderTeaser(
        mockCustomTeaser({ contentUrl: 'https://example.com/custom' })
      );

      const link = screen.getByRole('link', {
        name: teaserLabel({ title: 'This is a title', lead: 'This is a lead' }),
      });

      expect(link).toHaveAttribute('href', 'https://example.com/custom');
      expect(link).not.toHaveAttribute('target');
    });

    it('opens the content url in a new tab when configured', () => {
      renderTeaser(mockCustomTeaser({ openInNewTab: true }));

      expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    });

    it('shows pre-title, title, lead and image', () => {
      renderTeaser(mockCustomTeaser({ image: teaserImage }));

      expect(screen.getByText('This is a pretitle')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: 'This is a title' })
      ).toBeInTheDocument();
      expect(screen.getByText('This is a lead')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Teaser image' })
      ).toBeInTheDocument();
    });

    it('shows neither pre-title nor image when they are missing', () => {
      const { container } = renderTeaser(
        mockCustomTeaser({ preTitle: null, image: null })
      );

      expect(screen.queryByText('This is a pretitle')).not.toBeInTheDocument();
      expect(container.querySelector('img')).toBeNull();
    });

    it('leaves the title out of the label when there is none', () => {
      renderTeaser(mockCustomTeaser({ title: null }));

      expect(
        screen.getByRole('link', {
          name: teaserLabel({ lead: 'This is a lead' }),
        })
      ).toBeInTheDocument();
    });

    it('shows the tags from the properties except the one used as pre-title', () => {
      renderTeaser(
        mockCustomTeaser({
          preTitle: 'Sport',
          properties: [
            {
              __typename: 'Property',
              key: 'tags',
              value: 'Sport, Kultur, Politik',
            },
          ],
        })
      );

      expect(screen.getAllByText('Sport')).toHaveLength(1);
      expect(screen.getByText('Kultur')).toBeInTheDocument();
      expect(screen.getByText('Politik')).toBeInTheDocument();
    });
  });
});

describe('teaser author selectors', () => {
  const articleTeaser = (hideAuthor: boolean) =>
    mockArticleTeaser({
      article: mockArticle({
        latest: mockArticleRevision({
          hideAuthor,
          authors: [
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'Visible Author' }),
            }),
            mockArticleRevisionAuthor({
              role: 'Text',
              author: mockAuthor({ name: 'Author With Role' }),
            }),
            mockArticleRevisionAuthor({
              author: mockAuthor({
                name: 'Hidden Author',
                hideOnTeaser: true,
              }),
            }),
          ],
        }),
      }),
    });

  describe('selectTeaserAuthors', () => {
    it('returns authors that are not hidden on teasers', () => {
      expect(selectTeaserAuthors(articleTeaser(false))).toEqual([
        'Visible Author',
        'Author With Role',
      ]);
    });

    it('returns no authors when the article hides its authors', () => {
      expect(selectTeaserAuthors(articleTeaser(true))).toBeNull();
    });
  });

  describe('selectTeaserAuthorsWithRole', () => {
    it('appends the role of every author that has one', () => {
      expect(selectTeaserAuthorsWithRole(articleTeaser(false))).toEqual([
        'Visible Author',
        'Author With Role (Text)',
      ]);
    });

    it('returns no authors when the article hides its authors', () => {
      expect(selectTeaserAuthorsWithRole(articleTeaser(true))).toBeNull();
    });
  });
});
