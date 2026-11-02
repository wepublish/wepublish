import { ComponentData, Config, Data } from '@puckeditor/core';

import {
  findSavedBlocksPlaceholder,
  insertBlocks,
  matchesSavedBlocks,
  mergeDynamicConfig,
  registryFor,
  removeBlockAt,
  SAVED_BLOCKS_TYPE,
  savedBlocksTargets,
  clashingComponents,
  savedBlocksModes,
  toSavedBlockTemplate,
  linkedTemplateBlock,
  toSavedBlocksInput,
  unlinkedContent,
  withMergedRegistry,
  withFreshIds,
  withSavedBlocksPlaceholder,
} from './saved-blocks';

const grid = (id: string, children: ComponentData[] = []): ComponentData => ({
  type: 'Grid',
  props: { id, items: [{ content: children }] },
});

const heading = (id: string): ComponentData => ({
  type: 'Heading',
  props: { id, text: id },
});

const data = (content: ComponentData[], rootProps = {}): Data => ({
  root: { props: rootProps },
  content,
});

const config: Config = {
  components: {
    Grid: {
      fields: {
        items: {
          type: 'array',
          arrayFields: { content: { type: 'slot' } },
        },
      },
      render: () => null as never,
    },
    Heading: { render: () => null as never },
    Teaser: {
      fields: {
        parts: { type: 'slot', allow: ['TeaserTitle'] },
      },
      render: () => null as never,
    },
    TeaserTitle: { render: () => null as never },
  },
};

describe('withFreshIds', () => {
  it('gives every block, nested ones included, a new id of its own type', () => {
    let next = 0;
    const fresh = withFreshIds(
      [grid('Grid-1', [heading('Heading-1'), grid('Grid-2', [heading('H')])])],
      type => `${type}-new-${++next}`
    );

    expect(fresh).toEqual([
      grid('Grid-new-1', [
        { type: 'Heading', props: { id: 'Heading-new-2', text: 'Heading-1' } },
        grid('Grid-new-3', [
          { type: 'Heading', props: { id: 'Heading-new-4', text: 'H' } },
        ]),
      ]),
    ]);
  });

  it('leaves the blocks it copies untouched', () => {
    const original = [grid('Grid-1', [heading('Heading-1')])];

    withFreshIds(original);

    expect(original).toEqual([grid('Grid-1', [heading('Heading-1')])]);
  });

  it('gives each copy different ids', () => {
    const [first] = withFreshIds([heading('Heading-1')]);
    const [second] = withFreshIds([heading('Heading-1')]);

    expect(first.props.id).toMatch(/^Heading-/);
    expect(first.props.id).not.toBe('Heading-1');
    expect(first.props.id).not.toBe(second.props.id);
  });
});

describe('insertBlocks', () => {
  it('inserts blocks into the root at the index', () => {
    expect(
      insertBlocks(data([heading('A'), heading('B')]), 'root:default-zone', 1, [
        heading('X'),
        heading('Y'),
      ]).content.map(({ props }) => props.id)
    ).toEqual(['A', 'X', 'Y', 'B']);
  });

  it('inserts blocks into a nested slot', () => {
    const inserted = insertBlocks(
      data([grid('Grid-1', [grid('Grid-2', [heading('A')])])]),
      'Grid-2:items[0].content',
      0,
      [heading('X')]
    );

    expect(inserted.content).toEqual([
      grid('Grid-1', [grid('Grid-2', [heading('X'), heading('A')])]),
    ]);
  });

  it('creates a slot that has no blocks yet', () => {
    const inserted = insertBlocks(
      data([{ type: 'Grid', props: { id: 'Grid-1', items: [{}] } }]),
      'Grid-1:items[0].content',
      0,
      [heading('X')]
    );

    expect(inserted.content).toEqual([grid('Grid-1', [heading('X')])]);
  });
});

describe('findSavedBlocksPlaceholder and removeBlockAt', () => {
  const placeholder = {
    type: SAVED_BLOCKS_TYPE,
    props: { id: 'SavedBlocks-1' },
  };

  it('finds a dropped placeholder in the root', () => {
    expect(
      findSavedBlocksPlaceholder(data([heading('A'), placeholder]))
    ).toEqual({ zone: 'root:default-zone', index: 1 });
  });

  it('finds a dropped placeholder in a nested slot', () => {
    expect(
      findSavedBlocksPlaceholder(
        data([grid('Grid-1', [heading('A'), placeholder])])
      )
    ).toEqual({ zone: 'Grid-1:items[0].content', index: 1 });
  });

  it('finds nothing without a placeholder', () => {
    expect(findSavedBlocksPlaceholder(data([grid('Grid-1')]))).toBeNull();
  });

  it('removes the block at a nested position', () => {
    expect(
      removeBlockAt(
        data([grid('Grid-1', [heading('A'), placeholder])]),
        'Grid-1:items[0].content',
        1
      ).content
    ).toEqual([grid('Grid-1', [heading('A')])]);
  });
});

describe('registries', () => {
  const hero = { html: '<section></section>' };
  const card = { html: '<article></article>' };

  it('keeps only the generated components the blocks use', () => {
    expect(
      registryFor([grid('Grid-1', [{ type: 'Hero', props: { id: 'h' } }])], {
        components: { Hero: hero, Card: card },
        styles: '.hero {}',
      })
    ).toEqual({ components: { Hero: hero }, styles: '.hero {}' });
  });

  it('has no registry for blocks without generated components', () => {
    expect(
      registryFor([heading('A')], { components: { Hero: hero } })
    ).toBeUndefined();
    expect(registryFor([heading('A')], undefined)).toBeUndefined();
  });

  it('adds the components of a template the document lacks, keeping its own', () => {
    expect(
      mergeDynamicConfig(
        { components: { Hero: hero }, styles: '.a {}' },
        {
          components: { Hero: card, Card: card },
          styles: '.b {}',
          script: 'run()',
        }
      )
    ).toEqual({
      components: { Hero: hero, Card: card },
      styles: '.a {}\n.b {}',
      script: 'run()',
    });
  });

  it('does not repeat styles the document already has', () => {
    expect(
      mergeDynamicConfig(
        { components: {}, styles: '.a {}' },
        { components: {}, styles: '.a {}' }
      )
    ).toEqual({ components: {}, styles: '.a {}' });
  });

  it('takes the template registry when the document has none', () => {
    expect(
      mergeDynamicConfig(undefined, { components: { Hero: hero } })
    ).toEqual({ components: { Hero: hero } });
  });
});

describe('savedBlocksTargets', () => {
  const root = { label: 'Page', count: 2 };

  it('offers the end of the document when nothing is selected', () => {
    expect(
      savedBlocksTargets(config, ['Heading'], { selected: null, root })
    ).toEqual([{ zone: 'root:default-zone', label: 'Page', count: 2 }]);
  });

  it('offers the slots that accept every block of the template, else the place below', () => {
    const teaser = {
      type: 'Teaser',
      props: { id: 'Teaser-1', parts: [] },
    };

    expect(
      savedBlocksTargets(config, ['TeaserTitle'], { selected: teaser, root })
    ).toEqual([
      expect.objectContaining({
        zone: 'Teaser-1:parts',
        allow: ['TeaserTitle'],
      }),
    ]);
    expect(
      savedBlocksTargets(config, ['TeaserTitle', 'Heading'], {
        selected: teaser,
        root,
        selector: { index: 0, zone: 'root:default-zone' },
      })
    ).toEqual([
      { zone: 'root:default-zone', label: 'Page', count: 2, index: 1 },
    ]);
  });
});

describe('matchesSavedBlocks', () => {
  it('matches the name regardless of case and accents', () => {
    expect(matchesSavedBlocks('Rubrik Événements', 'evene')).toBe(true);
    expect(matchesSavedBlocks('Rubrik', '  ')).toBe(true);
    expect(matchesSavedBlocks('Rubrik', 'teaser')).toBe(false);
  });
});

describe('withSavedBlocksPlaceholder', () => {
  it('registers a hidden placeholder that the AI never uses', () => {
    const placeholder =
      withSavedBlocksPlaceholder(config).components[SAVED_BLOCKS_TYPE];

    expect(placeholder).toEqual(
      expect.objectContaining({
        hidden: true,
        metadata: { ai: { exclude: true } },
      })
    );
    expect(withSavedBlocksPlaceholder(config).components['Grid']).toBe(
      config.components['Grid']
    );
  });
});

describe('withMergedRegistry', () => {
  const hero = { html: '<section></section>' };

  it('adds the registry of a template to the document', () => {
    expect(
      withMergedRegistry(data([], { title: 'T' }), {
        components: { Hero: hero },
      }).root.props
    ).toEqual({ title: 'T', _dynamicConfig: { components: { Hero: hero } } });
  });

  it('names the template components the document already has differently', () => {
    expect(
      clashingComponents(
        {
          components: {
            Hero: { html: '<section>document</section>' },
            Card: hero,
          },
        },
        { components: { Hero: hero, Card: hero, Footer: hero } }
      )
    ).toEqual(['Hero']);
    expect(
      clashingComponents(undefined, { components: { Hero: hero } })
    ).toEqual([]);
  });

  it('leaves the document alone without a template registry', () => {
    const document = data([], { title: 'T' });

    expect(withMergedRegistry(document, undefined)).toBe(document);
  });
});

describe('toSavedBlockTemplate', () => {
  it('never links a template into itself or into a template it links', () => {
    expect(savedBlocksModes({ id: 'a', linkedTemplateIds: [] }, 'a')).toEqual({
      linked: false,
      copy: true,
    });
    expect(
      savedBlocksModes({ id: 'b', linkedTemplateIds: ['c', 'a'] }, 'a')
    ).toEqual({ linked: false, copy: false });
    expect(
      savedBlocksModes({ id: 'b', linkedTemplateIds: ['c'] }, 'a')
    ).toEqual({ linked: true, copy: true });
    expect(savedBlocksModes({ id: 'a', linkedTemplateIds: [] }, null)).toEqual({
      linked: true,
      copy: true,
    });
  });

  it('rebuilds the blocks of a template with their top-level types', () => {
    expect(
      toSavedBlockTemplate({
        __typename: 'BlockTemplate',
        id: 'tpl',
        name: 'Rubric',
        createdAt: '',
        modifiedAt: '',
        puckBlocks: [
          {
            __typename: 'PuckBlock',
            id: 'Heading-1',
            kind: 'puck',
            type: 'Heading',
            parentId: null,
            puckSlot: null,
            position: 0,
            props: { text: 'Hi' },
          },
        ],
        puckRegistry: null,
        linkedTemplateIds: ['other'],
      } as never)
    ).toEqual({
      id: 'tpl',
      name: 'Rubric',
      types: ['Heading'],
      linkedTemplateIds: ['other'],
      content: [
        {
          type: 'Heading',
          props: expect.objectContaining({ id: 'Heading-1' }),
        },
      ],
    });
  });

  it('skips a template whose blocks cannot be rebuilt', () => {
    expect(
      toSavedBlockTemplate({
        id: 'tpl',
        name: 'Broken',
        puckBlocks: [
          {
            id: 'Lost',
            kind: 'puck',
            type: 'Heading',
            parentId: 'missing',
            puckSlot: 'content',
            position: 0,
            props: {},
          },
        ],
        puckRegistry: null,
      } as never)
    ).toBeNull();
  });
});

describe('toSavedBlocksInput', () => {
  it('saves a block with its subtree and the registry it needs', () => {
    const hero = { html: '<section></section>' };
    const input = toSavedBlocksInput(
      grid('Grid-1', [{ type: 'Hero', props: { id: 'Hero-1' } }]),
      config,
      { components: { Hero: hero, Other: hero } }
    );

    expect(input.puckRegistry).toEqual({ components: { Hero: hero } });
    expect(input.puckBlocks).toEqual([
      expect.objectContaining({
        id: 'Grid-1',
        type: 'Grid',
        children: [
          expect.objectContaining({
            id: 'Hero-1',
            kind: 'generated',
            puckSlot: 'items[0].content',
          }),
        ],
      }),
    ]);
  });
});

describe('linked templates', () => {
  it('links a template with a block of its own id', () => {
    const block = linkedTemplateBlock('tpl');

    expect(block).toEqual({
      type: 'LinkedTemplate',
      props: {
        id: expect.stringMatching(/^LinkedTemplate-/),
        templateId: 'tpl',
      },
    });
    expect(linkedTemplateBlock('tpl').props.id).not.toBe(block.props.id);
  });

  const flat = (
    id: string,
    type: string,
    parentId: string | null = null,
    puckSlot: string | null = null,
    props: Record<string, unknown> = {}
  ) => ({
    __typename: 'PuckBlock',
    id,
    kind: 'puck',
    type,
    parentId,
    puckSlot,
    position: 0,
    locked: null,
    grouped: null,
    visibility: null,
    styling: null,
    datasources: null,
    props,
    data: {},
  });

  it('copies the current content of a template with new ids, keeping nested links linked', () => {
    let next = 0;
    const content = unlinkedContent(
      {
        id: 'tpl',
        name: 'Rubric',
        puckRegistry: null,
        puckBlocks: [
          flat('ref/grid', 'Grid', null, null, { items: [{ content: [] }] }),
          flat('ref/title', 'Heading', 'ref/grid', 'items[0].content', {
            text: 'Hi',
          }),
          flat('ref/inner', 'LinkedTemplate', null, null, {
            templateId: 'inner',
          }),
          flat('ref/inner/text', 'Heading', 'ref/inner', 'template'),
        ],
      } as never,
      type => `${type}-new-${++next}`
    );

    expect(content).toEqual([
      {
        type: 'Grid',
        props: {
          id: 'Grid-new-1',
          items: [
            {
              content: [
                { type: 'Heading', props: { id: 'Heading-new-2', text: 'Hi' } },
              ],
            },
          ],
        },
      },
      {
        type: 'LinkedTemplate',
        props: { id: 'LinkedTemplate-new-3', templateId: 'inner' },
      },
    ]);
  });
});
