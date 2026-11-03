import { ForbiddenException } from '@nestjs/common';
import type { UserSession } from '@wepublish/authentication/api';
import {
  CanCreateArticle,
  CanCreatePage,
  CanGetArticle,
  Permission,
} from '@wepublish/permissions';
import { skipAnswerCache } from '@wepublish/public-content-cache/api';
import {
  flattenPuckBlocks,
  PuckBlockInput,
  PuckBlocksError,
  PuckRegistry,
} from '@wepublish/puck-content/api';

import { PuckBlockDataLoader } from './puck-block-data.loader';
import { PuckBlocksPreviewResolver } from './puck-blocks-preview.resolver';

vi.mock('@wepublish/public-content-cache/api', async importOriginal => ({
  ...(await importOriginal<object>()),
  skipAnswerCache: vi.fn(),
}));

const sessionWith = (...permissions: Permission[]) =>
  ({
    roles: [{ id: 'role', permissionIDs: permissions.map(({ id }) => id) }],
  }) as unknown as UserSession;

const puckBlocks = [
  {
    id: 'grid-1',
    kind: 'puck',
    type: 'Grid',
    props: { content: [] },
    visibility: { disabled: true },
    children: [
      { id: 'hero-1', kind: 'generated', type: 'HeroBanner', props: {} },
    ],
  },
] as unknown as PuckBlockInput[];

const puckRegistry = {
  components: { HeroBanner: { html: '<section></section>' } },
  script: 'boot()',
} as PuckRegistry;

describe('PuckBlocksPreviewResolver', () => {
  const loader = {
    flatten: vi.fn(flattenPuckBlocks),
  } as unknown as PuckBlockDataLoader;
  const resolver = new PuckBlocksPreviewResolver(loader);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['nobody', undefined],
    ['a user without permissions', sessionWith()],
    ['a user who can only read articles', sessionWith(CanGetArticle)],
  ])('refuses %s', (_, user) => {
    expect(() =>
      resolver.puckBlocksPreview(puckBlocks, puckRegistry, user, {}, true)
    ).toThrow(ForbiddenException);
  });

  it.each([
    ['articles', CanCreateArticle],
    ['pages', CanCreatePage],
  ])('lets a user who can only create %s preview', (_, permission) => {
    expect(() =>
      resolver.puckBlocksPreview(
        puckBlocks,
        puckRegistry,
        sessionWith(permission),
        {},
        false
      )
    ).not.toThrow();
  });

  it('reads the unsaved blocks flat, hidden ones included, like a saved revision', () => {
    const preview = resolver.puckBlocksPreview(
      puckBlocks,
      puckRegistry,
      sessionWith(CanCreatePage),
      {},
      true
    );

    expect(
      preview.puckBlocks.map(({ id, kind, parentId, puckSlot, position }) => ({
        id,
        kind,
        parentId,
        puckSlot,
        position,
      }))
    ).toEqual([
      {
        id: 'grid-1',
        kind: 'puck',
        parentId: null,
        puckSlot: null,
        position: 0,
      },
      {
        id: 'hero-1',
        kind: 'generated',
        parentId: 'grid-1',
        puckSlot: 'content',
        position: 0,
      },
    ]);
    expect(preview.puckRegistry).toEqual(puckRegistry);
  });

  it.each([
    ['in preview mode', true],
    ['published only outside preview mode', false],
  ])('resolves the data of every block %s', (_, isPreview) => {
    resolver.puckBlocksPreview(
      puckBlocks,
      puckRegistry,
      sessionWith(CanCreateArticle),
      {},
      isPreview
    );

    expect(loader.flatten).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'grid-1' })],
      { pruned: false, now: expect.any(Date), preview: isPreview }
    );
  });

  it('previews without a registry', () => {
    expect(
      resolver.puckBlocksPreview(
        [{ id: 'a', kind: 'puck', type: 'Title', props: {} }],
        undefined,
        sessionWith(CanCreateArticle),
        {},
        true
      ).puckRegistry
    ).toBeNull();
  });

  it('refuses blocks it would refuse to save', () => {
    expect(() =>
      resolver.puckBlocksPreview(
        puckBlocks,
        null,
        sessionWith(CanCreateArticle),
        {},
        true
      )
    ).toThrow(PuckBlocksError);
  });

  it('never caches the preview', () => {
    const context = {};

    resolver.puckBlocksPreview(
      puckBlocks,
      puckRegistry,
      sessionWith(CanCreateArticle),
      context,
      false
    );

    expect(skipAnswerCache).toHaveBeenCalledWith(context);
  });
});
