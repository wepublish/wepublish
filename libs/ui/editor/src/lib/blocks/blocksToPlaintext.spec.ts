import { EditorBlockType, FullImageFragment } from '@wepublish/editor/api';

import { getSeoBlockContext } from './blocksToPlaintext';
import { BlockValue } from './types';

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

describe('getSeoBlockContext', () => {
  test('counts the words of all text content without merging paragraphs', () => {
    const blocks = [
      {
        key: '1',
        type: EditorBlockType.Title,
        value: { preTitle: 'Pre', title: 'Title', lead: 'Lead' },
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
        type: EditorBlockType.Listicle,
        value: {
          items: [
            {
              value: {
                title: 'Item',
                richText: { type: 'doc', content: [paragraph('Text')] },
              },
            },
          ],
        },
      },
      {
        key: '5',
        type: EditorBlockType.RichText,
        value: {
          disabled: true,
          richText: { type: 'doc', content: [paragraph('Hidden')] },
        },
      },
      {
        key: '6',
        type: EditorBlockType.HTML,
        value: { html: '<p>Ignored</p>' },
      },
    ] as unknown as BlockValue[];

    expect(getSeoBlockContext(blocks).stats.wordCount).toBe(9);
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
    expect(context).not.toHaveProperty('body');
    expect(context.stats.wordCount).toBe(7);
  });

  test('handles empty content', () => {
    expect(getSeoBlockContext([])).toEqual({
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
