import { describe, expect, it } from 'vitest';
import { subscribePlanOf } from './targets';

describe('subscribePlanOf', () => {
  it('takes the fixture plan of the example seed by default', () => {
    expect(subscribePlanOf('website-example')).toBe('test-abo-chf');
  });

  // Its subscribe page only offers the nw-* plans.
  it('takes a plan the Neue Wege subscribe page offers', () => {
    expect(subscribePlanOf('neuewege')).toBe('nw-jahresabo');
  });
});
