import { Weekday } from '@wepublish/editor/api';

import { ApiBlock, toPuckContent, toPuckData } from './api-blocks';

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

describe('toPuckContent', () => {
  it('turns a block into component data with its type, props and id', () => {
    const blocks: ApiBlock[] = [
      {
        id: id(1),
        visibility: {},
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
          visibility: {},
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
        visibility: {},
        datasources: {},
        data: { type: 'Container' },
        children: [
          {
            id: id(2),
            visibility: {},
            datasources: {},
            data: { type: 'Grid' },
            children: [
              {
                id: id(3),
                visibility: {},
                datasources: {},
                data: { type: 'Title' },
              },
            ],
          },
        ],
      },
    ]);

    expect(container.props.content).toEqual([
      {
        type: 'Grid',
        props: {
          id: id(2),
          visibility: {},
          datasources: {},
          content: [
            {
              type: 'Title',
              props: { id: id(3), visibility: {}, datasources: {} },
            },
          ],
        },
      },
    ]);
  });

  it('turns every child of a slider into its own slide', () => {
    const [slider] = toPuckContent([
      {
        id: id(1),
        visibility: {},
        datasources: {},
        data: { type: 'Slider', settings: { xs: { perView: 1 } } },
        children: [
          {
            id: id(2),
            visibility: {},
            datasources: {},
            data: { type: 'Image' },
          },
          {
            id: id(3),
            visibility: {},
            datasources: {},
            data: { type: 'Quote' },
          },
        ],
      },
    ]);

    expect(slider.props).toEqual({
      id: id(1),
      visibility: {},
      datasources: {},
      settings: { xs: { perView: 1 } },
      items: [
        {
          content: [
            {
              type: 'Image',
              props: { id: id(2), visibility: {}, datasources: {} },
            },
          ],
        },
        {
          content: [
            {
              type: 'Quote',
              props: { id: id(3), visibility: {}, datasources: {} },
            },
          ],
        },
      ],
    });
  });

  it('never lets the block data override the id or the datasources', () => {
    const [component] = toPuckContent([
      {
        id: id(1),
        datasources: { page: { type: 'list' } },
        data: { type: 'Row', id: 'other', visibility: {}, datasources: {} },
      },
    ]);

    expect(component.props.id).toBe(id(1));
    expect(component.props.datasources).toEqual({ page: { type: 'list' } });
  });
});

describe('visibility', () => {
  it('moves the block visibility into the component props', () => {
    const visibility = {
      disabled: true,
      timings: { weekdays: [Weekday.Monday] },
      breakpoints: ['md' as const],
    };

    expect(
      toPuckData([
        { id: id(1), visibility, datasources: {}, data: { type: 'Title' } },
      ]).content
    ).toEqual([
      { type: 'Title', props: { id: id(1), visibility, datasources: {} } },
    ]);
  });

  it('rejects blocks without visibility', () => {
    expect(() =>
      toPuckData([{ id: id(1), datasources: {}, data: { type: 'Title' } }])
    ).toThrow();
  });
});

describe('locked', () => {
  it('moves the block lock into the component props', () => {
    expect(
      toPuckData([
        {
          id: id(1),
          locked: true,
          visibility: {},
          datasources: {},
          data: { type: 'Title' },
        },
      ]).content
    ).toEqual([
      {
        type: 'Title',
        props: { id: id(1), locked: true, visibility: {}, datasources: {} },
      },
    ]);
  });

  it('leaves unlocked blocks without a lock prop', () => {
    expect(
      toPuckData([
        {
          id: id(1),
          locked: false,
          visibility: {},
          datasources: {},
          data: { type: 'Title' },
        },
      ]).content[0].props
    ).not.toHaveProperty('locked');
  });
});

describe('toPuckData', () => {
  it('validates the API response and puts the blocks into the root content', () => {
    expect(
      toPuckData([
        {
          id: id(1),
          visibility: {},
          datasources: {},
          data: { type: 'Title', title: 'Hi' },
        },
      ])
    ).toEqual({
      root: { props: {} },
      content: [
        {
          type: 'Title',
          props: { id: id(1), visibility: {}, datasources: {}, title: 'Hi' },
        },
      ],
    });
  });

  it('maps the page metadata onto the root props and drops empty values', () => {
    expect(
      toPuckData([], {
        title: 'Page',
        hidden: false,
        seoTitle: null,
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      }).root
    ).toEqual({
      props: {
        title: 'Page',
        hidden: false,
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      },
    });
  });

  it('rejects invalid page metadata', () => {
    expect(() =>
      toPuckData([], { properties: [{ value: 'dark', public: true }] })
    ).toThrow();
  });

  it('rejects blocks without a component type', () => {
    expect(() =>
      toPuckData([
        { id: id(1), visibility: {}, datasources: {}, data: { title: 'Hi' } },
      ])
    ).toThrow();
  });
});
