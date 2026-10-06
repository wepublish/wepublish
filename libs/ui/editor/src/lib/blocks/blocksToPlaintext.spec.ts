import { EditorBlockType, FullImageFragment } from '@wepublish/editor/api';

import { blocksToPlaintext, getSeoBlockContext } from './blocksToPlaintext';
import { BlockValue } from './types';

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('blocksToPlaintext', () => {
  test('extracts text from content blocks and separates paragraphs', () => {
    const blocks = [
      {
        key: '1',
        type: EditorBlockType.Title,
        value: { preTitle: '', title: 'Title', lead: 'Lead' },
      },
      {
        key: '2',
        type: EditorBlockType.RichText,
        value: {
          richText: {
            type: 'doc',
            content: [paragraph('First.'), paragraph('Second.')],
          },
        },
      },
      {
        key: '3',
        type: EditorBlockType.Quote,
        value: { quote: 'Quote', author: 'Author' },
      },
      {
        key: '4',
        type: EditorBlockType.RichText,
        value: {
          disabled: true,
          richText: { type: 'doc', content: [paragraph('Hidden')] },
        },
      },
      {
        key: '5',
        type: EditorBlockType.HTML,
        value: { html: '<p>Ignored</p>' },
      },
    ] as unknown as BlockValue[];

    expect(blocksToPlaintext(blocks)).toBe(
      'Title\nLead\nFirst.\nSecond.\nQuote\nAuthor'
    );
  });

  test('returns an empty string without blocks', () => {
    expect(blocksToPlaintext([])).toBe('');
  });
});

describe('getSeoBlockContext', () => {
  const image = (id: string, description: string | null) =>
    ({ id, description }) as unknown as FullImageFragment;

  test('collects the first title, paragraph and image and counts content', () => {
    const blocks = [
      {
        key: '1',
        type: EditorBlockType.Title,
        value: { preTitle: '', title: 'Title', lead: 'Lead' },
      },
      {
        key: '2',
        type: EditorBlockType.Image,
        value: { image: image('a', 'A bike lane'), caption: '' },
      },
      {
        key: '3',
        type: EditorBlockType.RichText,
        value: {
          richText: {
            type: 'doc',
            content: [
              paragraph('First paragraph.'),
              {
                type: 'heading',
                content: [{ type: 'text', text: 'Subheading' }],
              },
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'a link',
                    marks: [{ type: 'link', attrs: { href: '/a/x' } }],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        key: '4',
        type: EditorBlockType.ImageGallery,
        value: {
          images: [
            { image: image('b', ''), caption: '' },
            { image: null, caption: '' },
          ],
        },
      },
      {
        key: '5',
        type: EditorBlockType.Image,
        value: { disabled: true, image: image('c', null), caption: '' },
      },
    ] as unknown as BlockValue[];

    const context = getSeoBlockContext(blocks);

    expect(context).toMatchObject({
      firstTitle: 'Title',
      firstParagraph: 'First paragraph.',
      firstImage: { id: 'a' },
      stats: {
        headingCount: 1,
        linkCount: 1,
        imageCount: 2,
        imagesWithoutDescription: 1,
      },
    });
    expect(context.body).toBe(
      'Title\nLead\nFirst paragraph.\nSubheading\na link'
    );
    expect(context.stats.wordCount).toBe(7);
  });

  test('handles empty content', () => {
    expect(getSeoBlockContext([])).toEqual({
      body: '',
      firstTitle: undefined,
      firstParagraph: undefined,
      firstImage: undefined,
      stats: {
        wordCount: 0,
        headingCount: 0,
        linkCount: 0,
        imageCount: 0,
        imagesWithoutDescription: 0,
      },
    });
  });
});
