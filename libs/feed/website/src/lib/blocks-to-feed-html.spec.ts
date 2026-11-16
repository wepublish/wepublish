import {
  mockBlockWithAlignment,
  mockFlexAlignment,
  mockFlexBlock,
  mockImage,
  mockImageBlock,
  mockQuoteBlock,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTitleBlock,
} from '@wepublish/mocks/website';

import { blocksToFeedHtml } from './blocks-to-feed-html';

const richText = (text: string) =>
  mockRichTextBlock({ richText: mockRichTextParagraph(text) });

const image = mockImage({
  m: 'https://media.test/800.webp',
  url: 'https://media.test/original.jpg',
  description: 'A river',
  title: null,
});

describe('blocksToFeedHtml', () => {
  it('serialises rich text', async () => {
    expect(await blocksToFeedHtml([richText('The whole body')])).toBe(
      '<p>The whole body</p>'
    );
  });

  it('serialises a title block as a subtitle with its lead', async () => {
    expect(
      await blocksToFeedHtml([
        mockTitleBlock({ title: 'Subtitle', lead: 'Its lead' }),
      ])
    ).toBe('<h2>Subtitle</h2><p>Its lead</p>');
  });

  it('leaves out an empty title lead', async () => {
    expect(
      await blocksToFeedHtml([
        mockTitleBlock({ title: 'Subtitle', lead: null }),
      ])
    ).toBe('<h2>Subtitle</h2>');
  });

  it('serialises a quote with its author', async () => {
    expect(
      await blocksToFeedHtml([
        mockQuoteBlock({ quote: 'A quote', author: 'Jane Doe' }),
      ])
    ).toBe('<blockquote><p>A quote</p><cite>Jane Doe</cite></blockquote>');
  });

  it('serialises a quote without an author', async () => {
    expect(
      await blocksToFeedHtml([
        mockQuoteBlock({ quote: 'A quote', author: null }),
      ])
    ).toBe('<blockquote><p>A quote</p></blockquote>');
  });

  it('drops a quote without text', async () => {
    expect(
      await blocksToFeedHtml([mockQuoteBlock({ quote: null, author: 'Jane' })])
    ).toBe('');
  });

  it('serialises an image with its caption, at the 800 pixel transform', async () => {
    expect(
      await blocksToFeedHtml([mockImageBlock({ image, caption: 'The river' })])
    ).toBe(
      '<figure><img src="https://media.test/800.webp" alt="A river"><figcaption>The river</figcaption></figure>'
    );
  });

  it('falls back to the original image when there is no transform', async () => {
    expect(
      await blocksToFeedHtml([
        mockImageBlock({ image: { ...image, m: null }, caption: null }),
      ])
    ).toBe(
      '<figure><img src="https://media.test/original.jpg" alt="A river"></figure>'
    );
  });

  it('keeps a caption whose image is gone', async () => {
    expect(
      await blocksToFeedHtml([mockImageBlock({ image: null, caption: 'Kept' })])
    ).toBe('<figure><figcaption>Kept</figcaption></figure>');
  });

  it('drops an image block with neither image nor caption', async () => {
    expect(
      await blocksToFeedHtml([mockImageBlock({ image: null, caption: null })])
    ).toBe('');
  });

  it('escapes text it writes itself', async () => {
    expect(
      await blocksToFeedHtml([
        mockQuoteBlock({ quote: 'Tom & <b>Jerry</b>', author: '"Me"' }),
      ])
    ).toBe(
      '<blockquote><p>Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;</p><cite>&quot;Me&quot;</cite></blockquote>'
    );
  });

  it('drops blocks it cannot serialise', async () => {
    expect(
      await blocksToFeedHtml([
        { __typename: 'PollBlock' },
        { __typename: 'HTMLBlock' },
      ])
    ).toBe('');
  });

  it('keeps the document order', async () => {
    expect(
      await blocksToFeedHtml([
        mockTitleBlock({ title: 'One', lead: null }),
        mockImageBlock({ image: null, caption: 'Two' }),
        richText('Three'),
        mockQuoteBlock({ quote: 'Four', author: null }),
      ])
    ).toBe(
      '<h2>One</h2><figure><figcaption>Two</figcaption></figure><p>Three</p><blockquote><p>Four</p></blockquote>'
    );
  });

  it('inlines the blocks of a flex block in reading order', async () => {
    expect(
      await blocksToFeedHtml([
        mockFlexBlock({
          blocks: [
            mockBlockWithAlignment({
              alignment: mockFlexAlignment({ x: 6, y: 1 }),
              block: richText('Right'),
            }),
            mockBlockWithAlignment({
              alignment: mockFlexAlignment({ x: 0, y: 1 }),
              block: richText('Left'),
            }),
            mockBlockWithAlignment({
              alignment: mockFlexAlignment({ x: 0, y: 0 }),
              block: mockTitleBlock({ title: 'Top', lead: null }),
            }),
          ],
        }),
      ])
    ).toBe('<h2>Top</h2><p>Left</p><p>Right</p>');
  });

  it('serialises nothing for no blocks', async () => {
    expect(await blocksToFeedHtml([])).toBe('');
  });
});
