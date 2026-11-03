import { Prisma } from '@prisma/client';

import {
  puckBlocksColumn,
  puckDocumentColumns,
  puckRegistryColumn,
} from './puck-blocks-column';
import { PuckBlocksError } from './puck-blocks';

describe('puckBlocksColumn', () => {
  it.each([undefined, null])('stores %s as a database null', value => {
    expect(puckBlocksColumn(value)).toBe(Prisma.DbNull);
  });

  it('stores valid blocks as they are', () => {
    const blocks = [
      { id: 'heading-1', kind: 'puck', type: 'Heading', props: {} },
    ];

    expect(puckBlocksColumn(blocks)).toEqual(blocks);
  });

  it('stores the blocks as parsed, with timings as ISO strings', () => {
    expect(
      puckBlocksColumn([
        {
          id: 'heading-1',
          kind: 'puck',
          type: 'Heading',
          props: {},
          locked: null,
          visibility: { timings: { from: new Date('2026-01-05T08:00:00Z') } },
        },
      ])
    ).toEqual([
      {
        id: 'heading-1',
        kind: 'puck',
        type: 'Heading',
        props: {},
        visibility: { timings: { from: '2026-01-05T08:00:00.000Z' } },
      },
    ]);
  });

  it('stores an empty list', () => {
    expect(puckBlocksColumn([])).toEqual([]);
  });

  it('refuses invalid blocks', () => {
    expect(() => puckBlocksColumn({ root: {}, content: [] })).toThrow(
      PuckBlocksError
    );
  });
});

describe('puckRegistryColumn', () => {
  it.each([undefined, null])('stores %s as a database null', value => {
    expect(puckRegistryColumn(value)).toBe(Prisma.DbNull);
  });

  it('stores a registry as Puck AI keeps it', () => {
    const registry = {
      components: {
        HeroBanner: { html: '<section></section>', script: 'run()' },
      },
      styles: '.hero {}',
      script: 'boot()',
    };

    expect(puckRegistryColumn(registry)).toEqual(registry);
  });

  it('stores the registry as parsed, without the nulls a client sent', () => {
    expect(
      puckRegistryColumn({ components: {}, styles: null, script: null })
    ).toEqual({ components: {} });
  });

  it('refuses an invalid registry', () => {
    expect(() => puckRegistryColumn({ components: [] })).toThrow(
      PuckBlocksError
    );
  });
});

describe('puckDocumentColumns', () => {
  const heading = { id: 'heading-1', kind: 'puck', type: 'Heading', props: {} };
  const hero = {
    id: 'hero-1',
    kind: 'generated',
    type: 'HeroBanner',
    props: {},
  };
  const registry = {
    components: { HeroBanner: { html: '<section></section>' } },
  };
  const latest = { puckBlocks: [heading, hero], puckRegistry: registry };

  it('stores the given blocks and registry as parsed', () => {
    expect(
      puckDocumentColumns(
        {
          puckBlocks: [{ ...heading, locked: null }, hero],
          puckRegistry: { ...registry, styles: null },
        },
        latest
      )
    ).toEqual({ puckBlocks: [heading, hero], puckRegistry: registry });
  });

  it('carries over what is omitted from the latest revision, as stored', () => {
    const columns = puckDocumentColumns({}, latest);

    expect(columns.puckBlocks).toBe(latest.puckBlocks);
    expect(columns.puckRegistry).toBe(latest.puckRegistry);
  });

  it('clears what is null', () => {
    expect(
      puckDocumentColumns({ puckBlocks: null, puckRegistry: null }, latest)
    ).toEqual({ puckBlocks: Prisma.DbNull, puckRegistry: Prisma.DbNull });
  });

  it.each([undefined, null, { puckBlocks: null, puckRegistry: null }])(
    'stores database nulls for omitted fields without a stored %s',
    stored => {
      expect(puckDocumentColumns({}, stored)).toEqual({
        puckBlocks: Prisma.DbNull,
        puckRegistry: Prisma.DbNull,
      });
    }
  );

  it('refuses invalid blocks or an invalid registry', () => {
    expect(() =>
      puckDocumentColumns({ puckBlocks: [{ id: 'a', props: {} }] }, latest)
    ).toThrow(PuckBlocksError);
    expect(() =>
      puckDocumentColumns({ puckRegistry: { components: [] } }, latest)
    ).toThrow(PuckBlocksError);
  });

  it('refuses generated blocks the given registry lacks', () => {
    expect(() =>
      puckDocumentColumns(
        { puckBlocks: [hero], puckRegistry: { components: {} } },
        null
      )
    ).toThrow(
      'Puck blocks are invalid: blocks[0].type must name a generated component of the registry.'
    );
  });

  it('checks given blocks against the registry it carries over', () => {
    expect(
      puckDocumentColumns({ puckBlocks: [hero] }, latest).puckBlocks
    ).toEqual([hero]);
    expect(() =>
      puckDocumentColumns(
        { puckBlocks: [hero] },
        { puckBlocks: [], puckRegistry: null }
      )
    ).toThrow(PuckBlocksError);
  });

  it('checks a given registry against the blocks it carries over', () => {
    expect(() =>
      puckDocumentColumns({ puckRegistry: { components: {} } }, latest)
    ).toThrow(
      'Puck blocks are invalid: blocks[1].type must name a generated component of the registry.'
    );
    expect(() => puckDocumentColumns({ puckRegistry: null }, latest)).toThrow(
      PuckBlocksError
    );
  });

  it('keeps stored blocks it cannot parse and checks the registry as if there were none', () => {
    const stored = [{ id: 'old', type: 'Heading', data: {} }];

    expect(
      puckDocumentColumns(
        { puckRegistry: { components: {} } },
        { puckBlocks: stored, puckRegistry: registry }
      )
    ).toEqual({ puckBlocks: stored, puckRegistry: { components: {} } });
  });
});
