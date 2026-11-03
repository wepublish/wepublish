import { hiddenBreakpoints, isHiddenOn } from './visibility';

const all = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

describe('hiddenBreakpoints', () => {
  it('lists nothing when the block is shown everywhere', () => {
    expect(hiddenBreakpoints(undefined, [...all])).toEqual([]);
    expect(hiddenBreakpoints([...all], [...all])).toEqual([]);
  });

  it('lists the breakpoints missing from the value in breakpoint order', () => {
    expect(hiddenBreakpoints(['xl', 'xs', 'sm'], [...all])).toEqual([
      'md',
      'lg',
    ]);
  });
});

describe('isHiddenOn', () => {
  it('only hides breakpoints a value leaves out', () => {
    expect(isHiddenOn(undefined, 'xs')).toBe(false);
    expect(isHiddenOn(['xs'], 'xs')).toBe(false);
    expect(isHiddenOn(['xs'], 'md')).toBe(true);
  });

  it('treats a null value like an unset one', () => {
    expect(isHiddenOn(null, 'md')).toBe(false);
  });
});
