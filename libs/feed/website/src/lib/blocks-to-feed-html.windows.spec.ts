import {
  mockRichTextBlock,
  mockRichTextParagraph,
} from '@wepublish/mocks/website';

import { blocksToFeedHtml, toHtml } from './blocks-to-feed-html';

/**
 * Stands in for `@tiptap/html`, which opens a happy-dom window per call and
 * only lets go of it on a later turn of the event loop.
 */
const windows = vi.hoisted(() => ({ open: 0, mostOpen: 0, fail: false }));

vi.mock('@tiptap/html', () => ({
  generateHTML: () => {
    windows.open += 1;
    windows.mostOpen = Math.max(windows.mostOpen, windows.open);
    setImmediate(() => {
      windows.open -= 1;
    });

    if (windows.fail) {
      throw new Error('cannot serialise');
    }

    return '<p>rendered</p>';
  },
}));

const article = (richTextBlocks: number) =>
  Array.from({ length: richTextBlocks }, (_, index) =>
    mockRichTextBlock({ richText: mockRichTextParagraph(`Block ${index}`) })
  );

describe('blocksToFeedHtml windows', () => {
  beforeEach(async () => {
    // The last window of the previous test closes a turn after it resolved.
    await new Promise(resolve => setImmediate(resolve));

    windows.open = 0;
    windows.mostOpen = 0;
    windows.fail = false;
  });

  it('lets each rich text window close before it opens the next', async () => {
    const html = await blocksToFeedHtml(article(5));

    expect(html).toBe('<p>rendered</p>'.repeat(5));
    expect(windows.mostOpen).toBe(1);
  });

  it('keeps a single window open across feeds rendered at the same time', async () => {
    await Promise.all([
      blocksToFeedHtml(article(4)),
      blocksToFeedHtml(article(4)),
      blocksToFeedHtml(article(4)),
    ]);

    expect(windows.mostOpen).toBe(1);
  });

  it('keeps rendering after a document that cannot be serialised', async () => {
    windows.fail = true;
    await expect(toHtml(mockRichTextParagraph('Broken'))).rejects.toThrow(
      'cannot serialise'
    );

    windows.fail = false;
    expect(await blocksToFeedHtml(article(2))).toBe(
      '<p>rendered</p>'.repeat(2)
    );
    expect(windows.mostOpen).toBe(1);
  });
});
