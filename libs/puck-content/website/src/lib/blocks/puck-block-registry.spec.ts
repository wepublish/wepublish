import { PuckBlockKind } from '@wepublish/website/api';

import { PuckBlockType, puckBlockTypes } from './block-props';
import { PuckBlockComponent, PuckBlockRegistry } from './block.types';
import {
  isGeneratedPuckBlock,
  puckBlockDefinition,
  puckBlockProps,
  puckBlockRegistry,
} from './puck-block-registry';

const Box: PuckBlockComponent<object> = () => null;

const components = {
  Box: { component: Box },
  Missing: undefined,
};

describe('puckBlockRegistry', () => {
  it('has a website component for every block type', () => {
    const registry: PuckBlockRegistry = puckBlockRegistry;

    expectTypeOf<
      keyof typeof puckBlockRegistry
    >().toEqualTypeOf<PuckBlockType>();
    expect(
      puckBlockTypes.filter(
        type => typeof registry[type]?.component !== 'function'
      )
    ).toEqual([]);
  });
});

describe('isGeneratedPuckBlock', () => {
  it('matches the blocks Puck AI generated', () => {
    expect(isGeneratedPuckBlock({ kind: PuckBlockKind.Generated })).toBe(true);
    expect(isGeneratedPuckBlock({ kind: PuckBlockKind.Puck })).toBe(false);
  });
});

describe('puckBlockDefinition', () => {
  it('finds the website component of a block type', () => {
    expect(
      puckBlockDefinition(components, { kind: PuckBlockKind.Puck, type: 'Box' })
    ).toBe(components.Box);
  });

  it('finds nothing for a generated block of the same type', () => {
    expect(
      puckBlockDefinition(components, {
        kind: PuckBlockKind.Generated,
        type: 'Box',
      })
    ).toBeUndefined();
  });

  it('finds nothing for an unknown type or one a tenant left out', () => {
    expect(
      puckBlockDefinition(components, {
        kind: PuckBlockKind.Puck,
        type: 'Unknown',
      })
    ).toBeUndefined();
    expect(
      puckBlockDefinition(components, {
        kind: PuckBlockKind.Puck,
        type: 'Missing',
      })
    ).toBeUndefined();
  });

  it('finds nothing for the names of the object prototype', () => {
    for (const type of ['constructor', 'toString', '__proto__']) {
      expect(
        puckBlockDefinition(components, { kind: PuckBlockKind.Puck, type })
      ).toBeUndefined();
    }
  });
});

describe('puckBlockProps', () => {
  it('returns the stored props of a block', () => {
    expect(puckBlockProps({ props: { title: 'Hello', content: [] } })).toEqual({
      title: 'Hello',
      content: [],
    });
  });

  it('returns no props for anything but an object', () => {
    for (const props of [null, undefined, 'text', 1, ['a']]) {
      expect(puckBlockProps({ props })).toEqual({});
    }
  });
});
