import {
  PuckBlockType,
  puckBlockTypes,
  PuckDocumentKind,
  puckDocumentKinds,
} from '@wepublish/puck-content/website';

import { config } from './config';
import { PuckEditorDocumentKind } from './document-kind/document-kind';
import {
  Components,
  PuckConfig,
  PuckData,
  PuckRootConfig,
} from './config.types';

describe('puckDocumentKinds', () => {
  it('lists every document kind once', () => {
    expect(puckDocumentKinds).toEqual(['page', 'article']);
    expectTypeOf<
      (typeof puckDocumentKinds)[number]
    >().toEqualTypeOf<PuckDocumentKind>();
  });

  it('knows the same kinds as the editor', () => {
    expectTypeOf<PuckDocumentKind>().toEqualTypeOf<PuckEditorDocumentKind>();
  });
});

describe('Components', () => {
  it('offers exactly the block types the website renders', () => {
    expectTypeOf<keyof Components>().toEqualTypeOf<PuckBlockType>();
    expect(Object.keys(config.components).sort()).toEqual(
      [...puckBlockTypes].sort()
    );
  });
});

describe('PuckConfig', () => {
  it('gives pages the navigation and footer switches', () => {
    expectTypeOf<
      NonNullable<PuckData<'page'>['root']['props']>
    >().toHaveProperty('showFooter');
    expectTypeOf<
      NonNullable<PuckRootConfig<'page'>['fields']>
    >().toHaveProperty('showNavigation');
  });

  it('keeps page-only props out of the article root', () => {
    expectTypeOf<
      NonNullable<PuckData<'article'>['root']['props']>
    >().not.toHaveProperty('showFooter');
    expectTypeOf<
      NonNullable<PuckRootConfig<'article'>['fields']>
    >().not.toHaveProperty('showFooter');
    expectTypeOf<
      NonNullable<PuckRootConfig<'article'>['defaultProps']>
    >().not.toHaveProperty('showNavigation');
    expectTypeOf<
      NonNullable<PuckRootConfig<'article'>['fields']>
    >().toHaveProperty('authorIds');
  });

  it('shares the components between every document kind', () => {
    expectTypeOf<PuckConfig<'page'>['components']>().toEqualTypeOf<
      PuckConfig<'article'>['components']
    >();
    expectTypeOf<PuckData<'page'>['content']>().toEqualTypeOf<
      PuckData<'article'>['content']
    >();
  });
});
