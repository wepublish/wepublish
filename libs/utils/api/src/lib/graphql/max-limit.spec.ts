import { getMaxTake } from './max-limit';

it('should not exceed the max limit', () => {
  expect(getMaxTake(1000)).toBe(100);
});

it('should allow below 100', () => {
  expect(getMaxTake(10)).toBe(10);
});
