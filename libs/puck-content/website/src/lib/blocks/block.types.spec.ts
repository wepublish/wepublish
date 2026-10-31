import { FullPuckBlockDataFragment } from '@wepublish/website/api';

import { emptyPuckBlockData, PuckBlockData } from './block.types';

describe('emptyPuckBlockData', () => {
  it('holds no records of any model', () => {
    expect(
      Object.values(emptyPuckBlockData).every(value => value === null)
    ).toBe(true);
  });

  it('covers every model the website selects', () => {
    expectTypeOf(emptyPuckBlockData).toEqualTypeOf<PuckBlockData>();
    expectTypeOf<keyof PuckBlockData>().toEqualTypeOf<
      Exclude<keyof FullPuckBlockDataFragment, '__typename'>
    >();
    expect(Object.keys(emptyPuckBlockData).sort()).toEqual([
      'articles',
      'events',
      'images',
      'memberPlans',
      'pages',
      'userSubscriptions',
    ]);
  });
});
