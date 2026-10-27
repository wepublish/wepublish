import { ApiBlock, toPuckContent, toPuckData } from './api-blocks';

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

describe('toPuckContent', () => {
  it('turns a block into component data with its type, props and id', () => {
    const blocks: ApiBlock[] = [
      {
        id: id(1),
        datasources: {},
        data: { type: 'Button', text: 'Hello', variant: 'contained' },
      },
    ];

    expect(toPuckContent(blocks)).toEqual([
      {
        type: 'Button',
        props: {
          id: id(1),
          text: 'Hello',
          variant: 'contained',
          datasources: {},
        },
      },
    ]);
  });

  it('keeps the datasources including the data the API resolved', () => {
    const datasources = {
      article: { type: 'uniqueList' as const, data: [{ id: 'a1' }] },
      memberplan: { type: 'multiple' as const, ids: ['m1'], data: null },
    };

    const [component] = toPuckContent([
      { id: id(1), datasources, data: { type: 'Grid' } },
    ]);

    expect(component.props.datasources).toEqual(datasources);
  });

  it('fills the content slot with the children, recursively', () => {
    const [container] = toPuckContent([
      {
        id: id(1),
        datasources: {},
        data: { type: 'Container' },
        children: [
          {
            id: id(2),
            datasources: {},
            data: { type: 'Grid' },
            children: [{ id: id(3), datasources: {}, data: { type: 'Title' } }],
          },
        ],
      },
    ]);

    expect(container.props.content).toEqual([
      {
        type: 'Grid',
        props: {
          id: id(2),
          datasources: {},
          content: [{ type: 'Title', props: { id: id(3), datasources: {} } }],
        },
      },
    ]);
  });

  it('turns every child of a slider into its own slide', () => {
    const [slider] = toPuckContent([
      {
        id: id(1),
        datasources: {},
        data: { type: 'Slider', settings: { xs: { perView: 1 } } },
        children: [
          { id: id(2), datasources: {}, data: { type: 'Image' } },
          { id: id(3), datasources: {}, data: { type: 'Quote' } },
        ],
      },
    ]);

    expect(slider.props).toEqual({
      id: id(1),
      datasources: {},
      settings: { xs: { perView: 1 } },
      items: [
        {
          content: [{ type: 'Image', props: { id: id(2), datasources: {} } }],
        },
        {
          content: [{ type: 'Quote', props: { id: id(3), datasources: {} } }],
        },
      ],
    });
  });

  it('never lets the block data override the id or the datasources', () => {
    const [component] = toPuckContent([
      {
        id: id(1),
        datasources: { page: { type: 'list' } },
        data: { type: 'Row', id: 'other', datasources: {} },
      },
    ]);

    expect(component.props.id).toBe(id(1));
    expect(component.props.datasources).toEqual({ page: { type: 'list' } });
  });
});

describe('toPuckData', () => {
  it('validates the API response and puts the blocks into the root content', () => {
    expect(
      toPuckData([
        { id: id(1), datasources: {}, data: { type: 'Title', title: 'Hi' } },
      ])
    ).toEqual({
      root: { props: {} },
      content: [
        { type: 'Title', props: { id: id(1), datasources: {}, title: 'Hi' } },
      ],
    });
  });

  it('rejects blocks without a component type', () => {
    expect(() =>
      toPuckData([{ id: id(1), datasources: {}, data: { title: 'Hi' } }])
    ).toThrow();
  });
});
