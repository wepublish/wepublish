import { SlateToPmMigrator } from './slate-to-pm-migrator';

const makeMigrator = () =>
  new SlateToPmMigrator(undefined as any, undefined as any);

const linkMarks = (doc: any): { text: string; href: string }[] => {
  const out: { text: string; href: string }[] = [];
  const walk = (node: any): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') {
      return;
    }
    if (node.type === 'text') {
      for (const mark of node.marks ?? []) {
        if (mark.type === 'link') {
          out.push({ text: node.text, href: mark.attrs.href });
        }
      }
    }

    (node.content ?? []).forEach(walk);
  };
  walk(doc);

  return out;
};

describe('SlateToPmMigrator.migrate', () => {
  it('drops empty-label links instead of fabricating text from title/url', () => {
    const slate = [
      {
        type: 'unordered-list',
        children: [
          {
            type: 'list-item',
            children: [
              { text: '' },
              {
                type: 'link',
                url: 'https://example.com/video',
                title: 'Visible label',
                children: [{ text: 'Visible label' }],
              },
              { text: '' },
              {
                type: 'link',
                url: 'https://example.com/ghost',
                title: 'Ghost from title',
                children: [{ text: '' }],
              },
              { text: '' },
              {
                type: 'link',
                url: 'https://example.com/orphan',
                title: '',
                children: [{ text: '' }],
              },
              {
                type: 'link',
                url: 'https://example.com/whitespace',
                title: 'Whitespace label',
                children: [{ text: '\n' }],
              },
            ],
          },
        ],
      },
    ];

    const links = linkMarks(makeMigrator().migrate(slate));

    expect(links).toEqual([
      { text: 'Visible label', href: 'https://example.com/video' },
    ]);
  });

  it('wraps list-item inline content in a paragraph (tiptap `paragraph block*`)', () => {
    const slate = [
      {
        type: 'unordered-list',
        children: [
          {
            type: 'list-item',
            children: [{ text: 'plain item' }],
          },
        ],
      },
    ];

    const doc: any = makeMigrator().migrate(slate);
    const listItem = doc.content[0].content[0];

    expect(listItem.type).toBe('listItem');
    expect(listItem.content[0].type).toBe('paragraph');
    expect(listItem.content[0].content[0]).toMatchObject({
      type: 'text',
      text: 'plain item',
    });
  });

  it('migrates flex-nested richtext in the same pass (null → populated doc)', () => {
    const blocks = [
      {
        type: 'flexBlock',
        blocks: [
          {
            block: {
              type: 'richText',
              richText: null,
              slateRichText: [
                { type: 'paragraph', children: [{ text: 'Hero copy' }] },
              ],
            },
          },
        ],
      },
    ];

    const out = (makeMigrator() as any).migrateBlocksFromSlate(blocks);
    const nested = out[0].blocks[0].block.richText;

    expect(nested).not.toBeNull();
    expect(nested.type).toBe('doc');
    expect(JSON.stringify(nested)).toContain('Hero copy');
  });
});
