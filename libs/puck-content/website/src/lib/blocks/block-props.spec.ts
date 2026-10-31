import { contentBlockRegistry } from '../components/content/content.registry';
import { dataBlockRegistry } from '../components/data/data.registry';
import { formBlockRegistry } from '../components/form/form.registry';
import { layoutBlockRegistry } from '../components/layout/layout.registry';
import {
  PuckBlockPropsByType,
  PuckBlockType,
  puckBlockTypes,
} from './block-props';

describe('puckBlockTypes', () => {
  it('lists every block type of the group registries once', () => {
    const registered = [
      ...Object.keys(layoutBlockRegistry),
      ...Object.keys(contentBlockRegistry),
      ...Object.keys(formBlockRegistry),
      ...Object.keys(dataBlockRegistry),
    ];

    expect([...puckBlockTypes].sort()).toEqual([...registered].sort());
    expect(new Set(puckBlockTypes).size).toBe(puckBlockTypes.length);
  });

  it('names the props of every block type', () => {
    expectTypeOf(puckBlockTypes).items.toEqualTypeOf<PuckBlockType>();
    expectTypeOf<PuckBlockType>().toEqualTypeOf<keyof PuckBlockPropsByType>();
  });
});
