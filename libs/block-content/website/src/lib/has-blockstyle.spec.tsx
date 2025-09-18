import { hasBlockStyle } from './has-blockstyle';

it('should return if a block as a given style set', () => {
  const hasFoobarStyle = hasBlockStyle('foobar');

  expect(hasFoobarStyle({ blockStyle: 'foobar' })).toBeTruthy();
  expect(hasFoobarStyle({ blockStyle: 'barfoo' })).toBeFalsy();
});
