import {
  fitToRange,
  inheritedValue,
  mediaQuery,
  missingScreenSizes,
  overriddenScreenSizes,
  resolvedStyles,
  resolvedValue,
  screenSizesWithErrors,
  usedScreenSizes,
} from './typography-breakpoints';

const lineHeightConfig = {
  em: { min: 1, max: 3, step: 0.1 },
  rem: { min: 1, max: 3, step: 0.1 },
  px: { min: 12, max: 60, step: 1 },
};

const allVariants = { lineHeight: '1.4em', letterSpacing: null };

const sm = mediaQuery('sm');
const md = mediaQuery('md');
const lg = mediaQuery('lg');
const xl = mediaQuery('xl');

describe('mediaQuery', () => {
  it('is the min-width media query of the theme', () => {
    expect(mediaQuery('md')).toBe('@media (min-width:900px)');
    expect(mediaQuery('sm')).toBe('@media (min-width:600px)');
  });
});

describe('usedScreenSizes', () => {
  it('lists the set screen sizes from small to large', () => {
    expect(usedScreenSizes({ [xl]: {}, [sm]: {}, [md]: {} })).toEqual([
      'sm',
      'md',
      'xl',
    ]);
  });

  it('ignores other keys and a missing object', () => {
    expect(
      usedScreenSizes({
        fontSize: '2rem',
        '@media (min-width:1px)': {},
        [lg]: {},
      } as never)
    ).toEqual(['lg']);
    expect(usedScreenSizes(null)).toEqual([]);
  });
});

describe('overriddenScreenSizes', () => {
  it('lists the screen sizes that set at least one value', () => {
    expect(
      overriddenScreenSizes({
        [xl]: { fontSize: '4rem' },
        [sm]: {},
        [md]: { lineHeight: null, letterSpacing: '0.01em' },
        [lg]: { fontSize: null },
      })
    ).toEqual(['md', 'xl']);
    expect(overriddenScreenSizes(undefined)).toEqual([]);
  });
});

describe('missingScreenSizes', () => {
  it('lists the screen sizes that can still be added', () => {
    expect(missingScreenSizes({ [md]: {} })).toEqual(['sm', 'lg', 'xl']);
    expect(missingScreenSizes(undefined)).toEqual(['sm', 'md', 'lg', 'xl']);
  });
});

describe('inheritedValue', () => {
  const item = {
    fontSize: '2rem',
    lineHeight: null,
    [sm]: { fontSize: '2.5rem' },
    [md]: {},
    [lg]: { fontSize: '4rem', lineHeight: '1.1em' },
  };

  it('inherits from the next smaller screen size that sets the value', () => {
    expect(inheritedValue(item, allVariants, 'fontSize', 'md')).toEqual({
      value: '2.5rem',
      from: 'sm',
    });
    expect(inheritedValue(item, allVariants, 'fontSize', 'xl')).toEqual({
      value: '4rem',
      from: 'lg',
    });
  });

  it('falls back to all screens', () => {
    expect(inheritedValue(item, allVariants, 'fontSize', 'sm')).toEqual({
      value: '2rem',
      from: 'xs',
    });
  });

  it('falls back to the general value for line height and letter spacing', () => {
    expect(inheritedValue(item, allVariants, 'lineHeight', 'md')).toEqual({
      value: '1.4em',
      from: 'allVariants',
    });
    expect(
      inheritedValue(item, { letterSpacing: '0.02em' }, 'letterSpacing', 'md')
    ).toEqual({ value: '0.02em', from: 'allVariants' });
  });

  it('inherits the 0 letter spacing of the browser when nothing sets one', () => {
    expect(inheritedValue(item, allVariants, 'letterSpacing', 'md')).toEqual({
      value: '0em',
      from: 'browser',
    });
    expect(inheritedValue({}, undefined, 'letterSpacing', 'xs', 'h1')).toEqual({
      value: '0em',
      from: 'browser',
    });
  });

  it('falls back to the standard value of the theme', () => {
    expect(inheritedValue({}, allVariants, 'fontSize', 'md', 'h4')).toEqual({
      value: '1.625rem',
      from: 'theme',
    });
    expect(inheritedValue({}, null, 'lineHeight', 'sm', 'h1')).toEqual({
      value: '1.15em',
      from: 'theme',
    });
    expect(inheritedValue({}, null, 'letterSpacing', 'sm', 'body1')).toEqual({
      value: '0em',
      from: 'browser',
    });
  });

  it('prefers the general value over the standard value of the theme', () => {
    expect(inheritedValue({}, allVariants, 'lineHeight', 'sm', 'h1')).toEqual({
      value: '1.4em',
      from: 'allVariants',
    });
  });

  it('never uses its own value', () => {
    expect(inheritedValue(item, allVariants, 'fontSize', 'lg')).toEqual({
      value: '2.5rem',
      from: 'sm',
    });
  });
});

describe('resolvedValue', () => {
  const item = {
    fontSize: '2rem',
    [md]: { fontSize: '3rem', lineHeight: null },
  };

  it('uses the own value of the screen size', () => {
    expect(resolvedValue(item, allVariants, 'fontSize', 'md')).toBe('3rem');
  });

  it('uses the inherited value when the screen size does not set it', () => {
    expect(resolvedValue(item, allVariants, 'fontSize', 'lg')).toBe('3rem');
    expect(resolvedValue(item, allVariants, 'lineHeight', 'md')).toBe('1.4em');
  });

  it('resolves all screens from the base value', () => {
    expect(resolvedValue(item, allVariants, 'fontSize', 'xs')).toBe('2rem');
    expect(resolvedValue(item, allVariants, 'lineHeight', 'xs')).toBe('1.4em');
  });

  it('resolves the letter spacing the base shows when nothing sets it', () => {
    expect(resolvedValue(item, allVariants, 'letterSpacing', 'xs')).toBe('0em');
    expect(resolvedValue(item, null, 'letterSpacing', 'lg', 'h1')).toBe('0em');
  });
});

describe('fitToRange', () => {
  it('keeps a value inside the range', () => {
    expect(fitToRange('1.4em', lineHeightConfig)).toBe('1.4em');
    expect(fitToRange('20px', lineHeightConfig)).toBe('20px');
  });

  it('clamps a value outside the range of its unit', () => {
    expect(fitToRange('0.8em', lineHeightConfig)).toBe('1em');
    expect(fitToRange('4rem', lineHeightConfig)).toBe('3rem');
    expect(fitToRange('100px', lineHeightConfig)).toBe('60px');
  });

  it('treats a value without a unit as em', () => {
    expect(fitToRange('6', lineHeightConfig)).toBe('3em');
  });
});

describe('screenSizesWithErrors', () => {
  it('lists the screen sizes whose fields have errors, all screens first', () => {
    expect(
      screenSizesWithErrors({
        [xl]: { fontSize: { message: 'x' } },
        [sm]: { lineHeight: { message: 'x' } },
        fontSize: { message: 'x' },
      })
    ).toEqual(['xs', 'sm', 'xl']);
  });

  it('is empty without errors', () => {
    expect(screenSizesWithErrors(undefined)).toEqual([]);
    expect(screenSizesWithErrors({ [md]: {} })).toEqual([]);
  });
});

describe('resolvedStyles', () => {
  const item = {
    fontSize: '3rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    fontStyle: 'italic',
    [md]: { fontSize: '4rem', lineHeight: '1.1em' },
  };

  it('resolves the responsive values for the given screen size', () => {
    expect(resolvedStyles(item, allVariants, 'xs', 'h1')).toMatchObject({
      fontSize: '3rem',
      lineHeight: '1.4em',
    });
    expect(resolvedStyles(item, allVariants, 'lg', 'h1')).toMatchObject({
      fontSize: '4rem',
      lineHeight: '1.1em',
    });
  });

  it('keeps the global values on every screen size', () => {
    expect(resolvedStyles(item, allVariants, 'xl', 'h1')).toMatchObject({
      fontWeight: 700,
      textTransform: 'uppercase',
      fontStyle: 'italic',
    });
  });

  it('falls back to the base font family and weight, then to sans-serif', () => {
    expect(
      resolvedStyles(
        {},
        { fontFamily: 'Inter', fontWeight: 300 },
        'xs',
        'articleAuthors'
      )
    ).toMatchObject({ fontFamily: 'Inter', fontWeight: 300 });
    expect(
      resolvedStyles(undefined, undefined, 'xs', 'articleAuthors')
    ).toMatchObject({
      fontFamily: 'sans-serif',
      fontWeight: undefined,
    });
  });

  it('prefers the weight of the theme variant over the base weight', () => {
    expect(resolvedStyles({}, { fontWeight: 300 }, 'xs', 'h1').fontWeight).toBe(
      600
    );
    expect(resolvedStyles({}, undefined, 'xs', 'h1').fontWeight).toBe(600);
    expect(
      resolvedStyles({ fontWeight: 800 }, { fontWeight: 300 }, 'xs', 'h1')
        .fontWeight
    ).toBe(800);
  });
});
