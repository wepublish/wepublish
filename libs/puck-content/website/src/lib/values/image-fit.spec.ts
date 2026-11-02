import { createTheme } from '@mui/material';

import {
  aspectRatioCss,
  focalPointPosition,
  imageFitStyles,
  parseAspectRatio,
} from './image-fit';

const theme = createTheme();

describe('parseAspectRatio', () => {
  it('reads presets and custom ratios written as width:height', () => {
    expect(parseAspectRatio('16:9')).toEqual([16, 9]);
    expect(parseAspectRatio('2.35:1')).toEqual([2.35, 1]);
    expect(parseAspectRatio(' 5 : 4 ')).toEqual([5, 4]);
  });

  it('treats auto, empty and broken values as no ratio', () => {
    expect(parseAspectRatio('auto')).toBeNull();
    expect(parseAspectRatio(undefined)).toBeNull();
    expect(parseAspectRatio('0:9')).toBeNull();
    expect(parseAspectRatio('wide')).toBeNull();
  });
});

describe('aspectRatioCss', () => {
  it('turns a stored ratio into the CSS aspect-ratio value', () => {
    expect(aspectRatioCss('4:3')).toBe('4 / 3');
    expect(aspectRatioCss('auto')).toBeUndefined();
  });
});

describe('focalPointPosition', () => {
  it('positions the image on its focal point', () => {
    expect(focalPointPosition({ focalPointX: 0.25, focalPointY: 0.8 })).toBe(
      '25% 80%'
    );
  });

  it('centers images without a focal point', () => {
    expect(focalPointPosition(null)).toBe('center');
    expect(focalPointPosition({ focalPointX: null, focalPointY: 0.5 })).toBe(
      'center'
    );
  });
});

describe('imageFitStyles', () => {
  const toStyles = vi.fn((fit: unknown) => ({ fit: JSON.stringify(fit) }));

  beforeEach(() => toStyles.mockClear());

  it('adds no styles while no breakpoint sets a ratio', () => {
    expect(imageFitStyles(theme, undefined, toStyles)).toEqual({});
    expect(
      imageFitStyles(
        theme,
        { xs: { aspectRatio: 'auto', objectFit: 'contain' } },
        toStyles
      )
    ).toEqual({});
    expect(toStyles).not.toHaveBeenCalled();
  });

  it('defaults the object fit to cover once a ratio is set', () => {
    expect(
      imageFitStyles(theme, { xs: { aspectRatio: '16:9' } }, toStyles)
    ).toEqual({ fit: JSON.stringify({ ratio: '16 / 9', objectFit: 'cover' }) });
  });

  it('resolves every breakpoint and resets the ones back on auto', () => {
    expect(
      imageFitStyles(
        theme,
        {
          xs: { aspectRatio: '1:1', objectFit: 'contain' },
          md: { aspectRatio: 'auto' },
        },
        toStyles
      )
    ).toEqual({
      fit: JSON.stringify({ ratio: '1 / 1', objectFit: 'contain' }),
      [theme.breakpoints.up('md')]: { fit: JSON.stringify(null) },
    });
  });
});
