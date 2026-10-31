import {
  areSpacingKeysUniform,
  formatSpacingInput,
  linkSpacingKeys,
  parseSpacingInput,
  setSpacingKeys,
  stepSpacingValue,
} from './box-model';

describe('parseSpacingInput', () => {
  it('reads plain numbers as theme units', () => {
    expect(parseSpacingInput('2')).toEqual({ valid: true, value: 2 });
    expect(parseSpacingInput(' 1.5 ')).toEqual({ valid: true, value: 1.5 });
    expect(parseSpacingInput('1,5')).toEqual({ valid: true, value: 1.5 });
  });

  it('accepts a trailing decimal point while typing', () => {
    expect(parseSpacingInput('2.')).toEqual({ valid: true, value: 2 });
  });

  it('reads pixel values as exact pixels', () => {
    expect(parseSpacingInput('12px')).toEqual({ valid: true, value: '12px' });
    expect(parseSpacingInput('12 PX')).toEqual({ valid: true, value: '12px' });
  });

  it('clears the side when the input is empty', () => {
    expect(parseSpacingInput('')).toEqual({ valid: true, value: undefined });
    expect(parseSpacingInput('  ')).toEqual({ valid: true, value: undefined });
  });

  it('rejects anything else', () => {
    expect(parseSpacingInput('12rem')).toEqual({ valid: false });
    expect(parseSpacingInput('-2')).toEqual({ valid: false });
    expect(parseSpacingInput('px')).toEqual({ valid: false });
  });
});

describe('formatSpacingInput', () => {
  it('shows units as numbers and pixels with their unit', () => {
    expect(formatSpacingInput(2)).toBe('2');
    expect(formatSpacingInput('12px')).toBe('12px');
    expect(formatSpacingInput(undefined)).toBe('');
  });
});

describe('stepSpacingValue', () => {
  it('steps theme units and pixels without going below zero', () => {
    expect(stepSpacingValue(2, 1)).toBe(3);
    expect(stepSpacingValue(0.5, -1)).toBe(0);
    expect(stepSpacingValue('12px', 10)).toBe('22px');
    expect(stepSpacingValue('4px', -10)).toBe('0px');
  });

  it('starts from zero when the side is unset', () => {
    expect(stepSpacingValue(undefined, 1)).toBe(1);
    expect(stepSpacingValue(undefined, -1)).toBe(0);
  });
});

describe('linked spacing keys', () => {
  const sides = ['top', 'right', 'bottom', 'left'] as const;

  it('sets and clears several keys at once', () => {
    expect(setSpacingKeys({ top: 1, left: 3 }, ['top', 'bottom'], 2)).toEqual({
      top: 2,
      bottom: 2,
      left: 3,
    });
    expect(
      setSpacingKeys({ top: 1, left: 3 }, ['top', 'left'], undefined)
    ).toEqual({});
  });

  it('detects whether all keys share one value', () => {
    expect(areSpacingKeysUniform(undefined, sides)).toBe(true);
    expect(
      areSpacingKeysUniform({ top: 1, right: 1, bottom: 1, left: 1 }, sides)
    ).toBe(true);
    expect(areSpacingKeysUniform({ top: 1, bottom: 1 }, sides)).toBe(false);
  });

  it('unifies the keys on the first value set when linking', () => {
    expect(linkSpacingKeys({ right: '8px', bottom: 2 }, sides)).toEqual({
      top: '8px',
      right: '8px',
      bottom: '8px',
      left: '8px',
    });
    expect(linkSpacingKeys(undefined, sides)).toEqual({});
  });
});
