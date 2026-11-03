import { createTheme } from '@mui/material';

import { isLengthValue, radiusToCss, toLengthParts } from './styling';

describe('length values', () => {
  it('splits a length into amount and unit', () => {
    expect(toLengthParts('320px', ['px', 'vh'])).toEqual({
      amount: 320,
      unit: 'px',
    });
    expect(toLengthParts('50.5vh', ['px', 'vh'])).toEqual({
      amount: 50.5,
      unit: 'vh',
    });
    expect(toLengthParts('50%', ['px', 'vh'])).toBeUndefined();
    expect(toLengthParts(undefined, ['px'])).toBeUndefined();
  });

  it('recognises lengths in the allowed units only', () => {
    expect(isLengthValue('100%', ['px', '%'])).toBe(true);
    expect(isLengthValue('100vh', ['px', '%'])).toBe(false);
    expect(isLengthValue('md', ['px', '%'])).toBe(false);
  });
});

describe('radiusToCss', () => {
  it('multiplies numbers with the theme radius and keeps pixels', () => {
    const theme = createTheme({ shape: { borderRadius: 6 } });

    expect(radiusToCss(theme, 2)).toBe('12px');
    expect(radiusToCss(theme, '3px')).toBe('3px');
    expect(radiusToCss(theme, undefined)).toBeUndefined();
  });

  it('scales a radius given as CSS length with calc', () => {
    const theme = createTheme({ shape: { borderRadius: '0.5rem' } });

    expect(radiusToCss(theme, 2)).toBe('calc(0.5rem * 2)');
  });
});
