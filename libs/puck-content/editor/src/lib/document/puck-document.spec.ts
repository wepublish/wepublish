import { ComponentData } from '@puckeditor/core';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
  PuckBlockInput,
  PuckBlockKind,
  PuckDatasourceType,
} from '@wepublish/editor/api';
import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { z } from 'zod/v4';

import { getPuckConfig } from '../config';
import { PuckContent, PuckData } from '../config.types';
import { rootSchemas } from '../root/root.field';
import {
  fromPuckDocument,
  toPuckDocument,
  toPuckRootProps,
} from './puck-document';
import { PuckDynamicConfig } from './puck-registry';

const asContent = (components: ComponentData[]) =>
  components as unknown as PuckContent;

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const flatten = (
  inputs: readonly PuckBlockInput[],
  parentId: string | null = null
): FullPuckBlockFragment[] => {
  const positions = new Map<string, number>();

  return inputs.flatMap(
    ({
      children,
      puckSlot,
      locked,
      visibility,
      styling,
      datasources,
      ...block
    }) => {
      const slot = puckSlot ?? 'content';
      const position = positions.get(slot) ?? 0;

      positions.set(slot, position + 1);

      return [
        {
          __typename: 'PuckBlock',
          ...block,
          parentId,
          puckSlot: parentId === null ? null : slot,
          position,
          locked: locked ?? null,
          visibility: visibility ?? null,
          styling: styling ?? null,
          datasources: datasources ?? null,
        } as unknown as FullPuckBlockFragment,
        ...flatten(children ?? [], block.id),
      ];
    }
  );
};

const registryFragment = (
  registry: {
    components: unknown;
    styles?: string | null;
    script?: string | null;
  } | null
): FullPuckRegistryFragment | null =>
  registry && {
    __typename: 'PuckRegistry',
    components: registry.components,
    styles: registry.styles ?? null,
    script: registry.script ?? null,
  };

const dynamicConfig: PuckDynamicConfig = {
  components: {
    Columns: {
      html: '<div data-puck-slot="col.left"></div>',
      fields: { 'col.left': { type: 'slot' } },
      defaultProps: { heading: 'Columns' },
    },
  },
  styles: '.columns { display: flex; }',
  script: 'console.log("columns")',
};

const articleDocument: PuckData<'article'> = {
  root: {
    props: {
      preTitle: 'Kicker',
      title: 'Article',
      authorIds: ['author-1'],
      breaking: true,
    },
  },
  content: asContent([
    {
      type: 'Collapsible',
      props: {
        id: 'Collapsible-1',
        title: 'More',
        locked: true,
        content: [{ type: 'Title', props: { id: 'Title-2', title: 'Inside' } }],
      },
    },
  ]),
};

const generatedDocument = {
  root: { props: { title: 'Designed', _dynamicConfig: dynamicConfig } },
  content: asContent([
    {
      type: 'Columns',
      props: {
        id: 'Columns-1',
        heading: 'Two columns',
        'col.left': [
          { type: 'Title', props: { id: 'Title-2', title: 'Left' } },
        ],
      },
    },
  ]),
} as PuckData<'page'>;

describe('toPuckDocument', () => {
  it('splits a document into the puck blocks, the registry and the root props', () => {
    expect(
      toPuckDocument('article', articleDocument, getPuckConfig('article'))
    ).toEqual({
      puckBlocks: [
        {
          id: 'Collapsible-1',
          kind: PuckBlockKind.Puck,
          type: 'Collapsible',
          locked: true,
          props: { title: 'More', content: [] },
          children: [
            {
              id: 'Title-2',
              kind: PuckBlockKind.Puck,
              type: 'Title',
              props: { title: 'Inside' },
            },
          ],
        },
      ],
      puckRegistry: null,
      rootProps: articleDocument.root.props,
    });
  });

  it('stores the components the AI designed as the registry, apart from the root props', () => {
    const { puckBlocks, puckRegistry, rootProps } = toPuckDocument(
      'page',
      generatedDocument,
      getPuckConfig('page')
    );

    expect(puckRegistry).toEqual(dynamicConfig);
    expect(rootProps).toStrictEqual({ title: 'Designed' });
    expect(puckBlocks).toEqual([
      expect.objectContaining({
        id: 'Columns-1',
        kind: PuckBlockKind.Generated,
        props: { heading: 'Two columns', 'col.left': [] },
        children: [expect.objectContaining({ puckSlot: 'col.left' })],
      }),
    ]);
  });

  it('starts without root props when the document has none', () => {
    expect(
      toPuckDocument('page', { root: {}, content: [] }, getPuckConfig('page'))
    ).toEqual({ puckBlocks: [], puckRegistry: null, rootProps: {} });
  });

  it('derives the images of a lightbox from the images it shows', () => {
    const [lightbox] = toPuckDocument(
      'page',
      {
        root: {},
        content: asContent([
          {
            type: 'Lightbox',
            props: {
              id: 'Lightbox-1',
              images: [{ imageId: 'image-1' }, { imageId: 'image-2' }],
            },
          },
        ]),
      },
      getPuckConfig('page')
    ).puckBlocks;

    expect(lightbox.datasources).toEqual({
      image: {
        type: PuckDatasourceType.Multiple,
        ids: ['image-1', 'image-2'],
      },
    });
  });
});

describe('fromPuckDocument', () => {
  it('is undone by toPuckDocument on the flat list the API returns', () => {
    const { puckBlocks, puckRegistry, rootProps } = toPuckDocument(
      'article',
      articleDocument,
      getPuckConfig('article')
    );

    expect(
      fromPuckDocument(
        'article',
        asJson(flatten(puckBlocks)),
        registryFragment(puckRegistry),
        rootProps
      )
    ).toEqual({ data: articleDocument });
  });

  it('hands the registry back to Puck with the generated blocks in place', () => {
    const { puckBlocks, puckRegistry, rootProps } = toPuckDocument(
      'page',
      generatedDocument,
      getPuckConfig('page')
    );

    expect(
      fromPuckDocument(
        'page',
        asJson(flatten(puckBlocks)),
        registryFragment(puckRegistry),
        rootProps
      )
    ).toEqual({ data: generatedDocument });
  });

  it('gives Puck no dynamic config without a registry', () => {
    expect(fromPuckDocument('page', [], null, { title: 'About us' })).toEqual({
      data: { root: { props: { title: 'About us' } }, content: [] },
    });
  });

  it('starts a document without saved puck blocks empty', () => {
    expect(fromPuckDocument('article', null, undefined, {})).toEqual({
      data: { root: { props: {} }, content: [] },
    });
  });

  it('maps the page metadata onto the root props and drops empty values', () => {
    expect(
      fromPuckDocument('page', [], null, {
        title: 'Page',
        hidden: false,
        seoTitle: null,
        lead: '',
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      }).data?.root
    ).toEqual({
      props: {
        title: 'Page',
        hidden: false,
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      },
    });
  });

  it('maps the article metadata onto the root props of an article', () => {
    expect(
      fromPuckDocument('article', [], null, {
        preTitle: 'Kicker',
        title: 'Article',
        authorIds: ['author-1', 'author-2'],
        paywallId: null,
        canonicalUrl: '',
        breaking: true,
        socialMediaAuthorIds: ['author-2'],
      }).data?.root
    ).toEqual({
      props: {
        preTitle: 'Kicker',
        title: 'Article',
        authorIds: ['author-1', 'author-2'],
        breaking: true,
        socialMediaAuthorIds: ['author-2'],
      },
    });
  });

  it.each([
    ['article', { authorIds: 'author-1' }],
    ['page', { properties: [{ value: 'dark', public: true }] }],
  ] as const)(
    'reports %s metadata it cannot load instead of throwing',
    (kind, metadata) => {
      expect(fromPuckDocument(kind, [], null, metadata)).toEqual({
        error: expect.any(Error),
      });
    }
  );

  it('reports puck blocks without a place in the document instead of throwing', () => {
    expect(
      fromPuckDocument(
        'page',
        [
          {
            __typename: 'PuckBlock',
            id: 'Title-1',
            kind: PuckBlockKind.Puck,
            type: 'Title',
            parentId: 'Container-9',
            puckSlot: 'content',
            position: 0,
            locked: null,
            props: {},
            visibility: null,
            styling: null,
            datasources: null,
          },
        ],
        null,
        {}
      )
    ).toEqual({ error: expect.any(Error) });
  });
});

describe('toPuckRootProps', () => {
  it('keeps only the root props of the given document kind', () => {
    const metadata = {
      title: 'Title',
      showFooter: false,
      authorIds: ['author-1'],
      _dynamicConfig: dynamicConfig,
    };

    expect(toPuckRootProps('page', metadata)).toEqual({
      title: 'Title',
      showFooter: false,
    });
    expect(toPuckRootProps('article', metadata)).toEqual({
      title: 'Title',
      authorIds: ['author-1'],
    });
  });

  it('starts empty without metadata', () => {
    expect(toPuckRootProps('article')).toEqual({});
  });

  it.each(['page', 'article'] as const)(
    'loads a %s whose slug breaks the slug format, so it can be fixed',
    kind => {
      ['Impressum', 'about/team', 'über-uns'].forEach(slug =>
        expect(toPuckRootProps(kind, { slug })).toEqual({ slug })
      );
    }
  );

  it.each(['page', 'article'] as const)(
    'loads a %s property without a key, so it can be fixed',
    kind => {
      const properties = [{ key: '', value: 'dark', public: true }];

      expect(toPuckRootProps(kind, { properties })).toEqual({ properties });
    }
  );

  it.each(
    Object.entries(rootSchemas).flatMap(([kind, schema]) =>
      Object.entries(schema.shape)
        .filter(([, field]) => field instanceof z.ZodString)
        .map(([key]): [PuckDocumentKind, string] => [
          kind as PuckDocumentKind,
          key,
        ])
    )
  )('loads any text the %s %s holds', (kind, key) => {
    const metadata = { [key]: 'Not / A Valid Format – ü' };

    expect(toPuckRootProps(kind, metadata)).toEqual(metadata);
  });
});
