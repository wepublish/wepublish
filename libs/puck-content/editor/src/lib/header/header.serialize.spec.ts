import { serializeDocument } from './header.serialize';

describe('serializeDocument', () => {
  it('ignores the order of keys', () => {
    expect(
      serializeDocument({
        root: { props: { title: 'Home', slug: 'home' } },
        content: [{ type: 'Title', props: { id: 'a', text: 'Hi', level: 1 } }],
      })
    ).toBe(
      serializeDocument({
        content: [{ props: { level: 1, text: 'Hi', id: 'a' }, type: 'Title' }],
        root: { props: { slug: 'home', title: 'Home' } },
      })
    );
  });

  it('treats unset props like missing ones', () => {
    expect(
      serializeDocument({
        root: { props: { title: 'Home', lead: undefined } },
        content: [
          { type: 'Title', props: { id: 'a', text: undefined, level: 1 } },
        ],
      })
    ).toBe(
      serializeDocument({
        root: { props: { title: 'Home' } },
        content: [{ type: 'Title', props: { id: 'a', level: 1 } }],
      })
    );
  });

  it('ignores the empty zones Puck registers while rendering', () => {
    expect(
      serializeDocument({
        root: { props: {} },
        content: [],
        zones: { 'Grid-a:column-1': [], 'Grid-a:column-2': [] },
      })
    ).toBe(serializeDocument({ root: { props: {} }, content: [] }));
  });

  it('treats a document without root props like one with empty root props', () => {
    expect(serializeDocument({ content: [] })).toBe(
      serializeDocument({ root: { props: {} }, content: [] })
    );
  });

  it('keeps zones that hold content', () => {
    expect(
      serializeDocument({
        root: { props: {} },
        content: [],
        zones: {
          'Grid-a:column-1': [{ type: 'Title', props: { id: 'b' } }],
        },
      })
    ).not.toBe(serializeDocument({ root: { props: {} }, content: [] }));
  });

  it('notices edits to content, slots and root props', () => {
    const document = {
      root: { props: { title: 'Home' } },
      content: [
        {
          type: 'Container',
          props: {
            id: 'a',
            content: [{ type: 'Title', props: { id: 'b', text: 'Hi' } }],
          },
        },
      ],
    };

    expect(serializeDocument(document)).not.toBe(
      serializeDocument({ ...document, root: { props: { title: 'About' } } })
    );
    expect(serializeDocument(document)).not.toBe(
      serializeDocument({
        ...document,
        content: [
          {
            type: 'Container',
            props: {
              id: 'a',
              content: [{ type: 'Title', props: { id: 'b', text: 'Hello' } }],
            },
          },
        ],
      })
    );
  });

  it('keeps the order of blocks', () => {
    const first = { type: 'Title', props: { id: 'a' } };
    const second = { type: 'Title', props: { id: 'b' } };

    expect(
      serializeDocument({ root: { props: {} }, content: [first, second] })
    ).not.toBe(
      serializeDocument({ root: { props: {} }, content: [second, first] })
    );
  });
});
