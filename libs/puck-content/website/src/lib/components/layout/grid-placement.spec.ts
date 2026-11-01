import { createTheme } from '@mui/material';

import { gridLineToCss, gridPlacementStyles } from './grid-placement';

const theme = createTheme();

describe('gridLineToCss', () => {
  it('combines the start line with the span', () => {
    expect(gridLineToCss({ start: 3, span: 4 })).toBe('3 / span 4');
  });

  it('only spans when no start is set', () => {
    expect(gridLineToCss({ span: 4 })).toBe('span 4');
  });

  it('only places when no span is set', () => {
    expect(gridLineToCss({ start: 3 })).toBe('3');
  });

  it('leaves the line automatic without start and span', () => {
    expect(gridLineToCss({})).toBeUndefined();
    expect(gridLineToCss(undefined)).toBeUndefined();
  });
});

describe('gridPlacementStyles', () => {
  it('maps the column and row lines per breakpoint', () => {
    expect(
      gridPlacementStyles(theme, {
        xs: { column: { span: 12 } },
        md: { column: { start: 3, span: 6 }, row: { start: 2 } },
      })
    ).toEqual({
      gridColumn: 'span 12',
      gridRow: undefined,
      [theme.breakpoints.up('md')]: {
        gridColumn: '3 / span 6',
        gridRow: '2',
      },
    });
  });

  it('inherits an axis from a smaller breakpoint', () => {
    expect(
      gridPlacementStyles(theme, {
        xs: { row: { span: 2 } },
        md: { column: { span: 6 } },
      })
    ).toEqual({
      gridColumn: undefined,
      gridRow: 'span 2',
      [theme.breakpoints.up('md')]: {
        gridColumn: 'span 6',
        gridRow: 'span 2',
      },
    });
  });

  it('leaves the cell automatic without a placement', () => {
    expect(gridPlacementStyles(theme, undefined)).toEqual({
      gridColumn: undefined,
      gridRow: undefined,
    });
  });
});
