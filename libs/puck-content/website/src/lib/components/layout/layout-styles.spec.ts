import { createTheme } from '@mui/material';

import { gapStyles } from './gap';
import { cssStyles } from './with-css';

const theme = createTheme();

describe('cssStyles', () => {
  it('draws the border width per side with one style and colour', () => {
    expect(
      cssStyles(theme, {
        border: {
          width: { top: 2, bottom: 2, left: 1 },
          style: 'dashed',
          color: 'primary.main',
        },
      })
    ).toEqual({
      borderTop: `2px dashed ${theme.palette.primary.main}`,
      borderBottom: `2px dashed ${theme.palette.primary.main}`,
      borderLeft: `1px dashed ${theme.palette.primary.main}`,
    });
  });

  it('defaults the border to a solid line in the text colour', () => {
    expect(cssStyles(theme, { border: { width: { top: 1 } } })).toEqual({
      borderTop: '1px solid currentColor',
    });
  });

  it('applies the margin per side in spacing units or pixels', () => {
    expect(cssStyles(theme, { margin: { top: 3, bottom: '0px' } })).toEqual({
      marginTop: theme.spacing(3),
      marginBottom: '0px',
    });
  });

  it('ignores the margin on sides the component does not allow', () => {
    expect(
      cssStyles(theme, { margin: { top: 1, right: 2, left: 2 } }, [
        'top',
        'bottom',
      ])
    ).toEqual({
      marginTop: theme.spacing(1),
    });
  });

  it('applies the padding per side', () => {
    expect(
      cssStyles(theme, {
        padding: { top: 1, right: '12px', bottom: 1, left: 0 },
      })
    ).toEqual({
      paddingTop: theme.spacing(1),
      paddingRight: '12px',
      paddingBottom: theme.spacing(1),
      paddingLeft: theme.spacing(0),
    });
  });

  it('applies the text and background colours', () => {
    expect(
      cssStyles(theme, { color: 'primary.main', background: '#ffffff' })
    ).toEqual({
      color: theme.palette.primary.main,
      backgroundColor: '#ffffff',
    });
  });

  it('applies a theme typography variant', () => {
    expect(cssStyles(theme, { typography: 'h2' })).toEqual(theme.typography.h2);
  });

  it('ignores typography variants the theme does not define', () => {
    expect(cssStyles(theme, { typography: 'fontFamily' })).toEqual({});
    expect(cssStyles(theme, { typography: 'unknown' })).toEqual({});
  });

  it('lets the explicit text props win over the typography variant', () => {
    expect(
      cssStyles(theme, {
        typography: 'overline',
        fontWeight: 'bold',
        textTransform: 'none',
      })
    ).toMatchObject({
      fontSize: theme.typography.overline.fontSize,
      fontWeight: theme.typography.fontWeightBold,
      textTransform: 'none',
    });
  });

  it('maps the font weight steps onto the theme', () => {
    expect(cssStyles(theme, { fontWeight: 'light' })).toEqual({
      fontWeight: theme.typography.fontWeightLight,
    });
    expect(cssStyles(theme, { fontWeight: 'medium' })).toEqual({
      fontWeight: theme.typography.fontWeightMedium,
    });
  });

  it('draws the background image with its size and position', () => {
    expect(
      cssStyles(
        theme,
        {
          backgroundImage: 'image-1',
          backgroundSize: 'contain',
          backgroundPosition: 'right bottom',
        },
        undefined,
        'https://example.com/image.webp'
      )
    ).toEqual({
      backgroundImage: 'url("https://example.com/image.webp")',
      backgroundSize: 'contain',
      backgroundPosition: 'right bottom',
      backgroundRepeat: 'no-repeat',
    });
  });

  it('covers and centres the background image by default', () => {
    expect(
      cssStyles(theme, { backgroundImage: 'image-1' }, undefined, '/a.webp')
    ).toEqual({
      backgroundImage: 'url("/a.webp")',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    });
  });

  it('skips the background image until its url is known', () => {
    expect(
      cssStyles(theme, { backgroundImage: 'image-1', backgroundSize: 'auto' })
    ).toEqual({});
  });

  it('lays the overlay over the background image', () => {
    const overlay = `color-mix(in srgb, ${theme.palette.secondary.main} 40%, transparent)`;

    expect(
      cssStyles(
        theme,
        {
          backgroundImage: 'image-1',
          overlay: 'secondary.main',
          overlayOpacity: 40,
        },
        undefined,
        '/a.webp'
      )
    ).toMatchObject({
      backgroundImage: `linear-gradient(${overlay}, ${overlay}), url("/a.webp")`,
    });
  });

  it('tints the background colour with the overlay at half opacity by default', () => {
    const overlay = 'color-mix(in srgb, #000000 50%, transparent)';

    expect(cssStyles(theme, { overlay: '#000000' })).toEqual({
      backgroundImage: `linear-gradient(${overlay}, ${overlay})`,
    });
  });

  it('rounds the corners in theme radius multiples or pixels', () => {
    expect(
      cssStyles(theme, { borderRadius: { topLeft: 2, bottomRight: '3px' } })
    ).toEqual({
      borderTopLeftRadius: `${theme.shape.borderRadius * 2}px`,
      borderBottomRightRadius: '3px',
    });
  });

  it('limits the size', () => {
    expect(cssStyles(theme, { minHeight: '50vh', maxWidth: '80%' })).toEqual({
      minHeight: '50vh',
      maxWidth: '80%',
    });
  });

  it('uses the breakpoint width as maximum width', () => {
    expect(cssStyles(theme, { maxWidth: 'md' })).toEqual({
      maxWidth: `${theme.breakpoints.values.md}px`,
    });
  });

  it('applies the theme shadow and the opacity', () => {
    expect(cssStyles(theme, { shadow: 4, opacity: 80 })).toEqual({
      boxShadow: theme.shadows[4],
      opacity: 0.8,
    });
    expect(cssStyles(theme, { shadow: 0, opacity: 0 })).toEqual({
      boxShadow: theme.shadows[0],
      opacity: 0,
    });
  });

  it('ignores shadows the theme does not define', () => {
    expect(cssStyles(theme, { shadow: 40 })).toEqual({});
  });
});

describe('gapStyles', () => {
  it('maps the row and column gap', () => {
    expect(gapStyles(theme, { gap: { row: 1, column: '24px' } })).toEqual({
      rowGap: theme.spacing(1),
      columnGap: '24px',
    });
    expect(gapStyles(theme, undefined)).toEqual({
      rowGap: undefined,
      columnGap: undefined,
    });
  });
});
