import { createTheme } from '@mui/material';
import {
  FullPuckBlockFragment,
  PuckBlockStyling,
} from '@wepublish/website/api';

import {
  puckBackgroundImageUrl,
  stylingToCss,
  StylingToCssOptions,
} from './styling-to-css';

const theme = createTheme();

describe('stylingToCss', () => {
  it('draws the border width per side with one style and colour', () => {
    expect(
      stylingToCss(theme, {
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
    expect(stylingToCss(theme, { border: { width: { top: 1 } } })).toEqual({
      borderTop: '1px solid currentColor',
    });
  });

  it('applies the margin per side in spacing units or pixels', () => {
    expect(stylingToCss(theme, { margin: { top: 3, bottom: '0px' } })).toEqual({
      marginTop: theme.spacing(3),
      marginBottom: '0px',
    });
  });

  it('ignores the margin on sides the component does not allow', () => {
    expect(
      stylingToCss(
        theme,
        { margin: { top: 1, right: 2, left: 2 } },
        { marginSides: ['top', 'bottom'] }
      )
    ).toEqual({
      marginTop: theme.spacing(1),
    });
  });

  it('applies the padding per side', () => {
    expect(
      stylingToCss(theme, {
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
      stylingToCss(theme, { color: 'primary.main', background: '#ffffff' })
    ).toEqual({
      color: theme.palette.primary.main,
      backgroundColor: '#ffffff',
    });
  });

  it('applies a theme typography variant', () => {
    expect(stylingToCss(theme, { typography: 'h2' })).toEqual(
      theme.typography.h2
    );
  });

  it('ignores typography variants the theme does not define', () => {
    expect(stylingToCss(theme, { typography: 'fontFamily' })).toEqual({});
    expect(stylingToCss(theme, { typography: 'unknown' })).toEqual({});
  });

  it('lets the explicit text props win over the typography variant', () => {
    expect(
      stylingToCss(theme, {
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
    expect(stylingToCss(theme, { fontWeight: 'light' })).toEqual({
      fontWeight: theme.typography.fontWeightLight,
    });
    expect(stylingToCss(theme, { fontWeight: 'medium' })).toEqual({
      fontWeight: theme.typography.fontWeightMedium,
    });
  });

  it('draws the background image with its size and position', () => {
    expect(
      stylingToCss(
        theme,
        {
          backgroundImage: 'image-1',
          backgroundSize: 'contain',
          backgroundPosition: 'right bottom',
        },
        { backgroundImageUrl: 'https://example.com/image.webp' }
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
      stylingToCss(
        theme,
        { backgroundImage: 'image-1' },
        { backgroundImageUrl: '/a.webp' }
      )
    ).toEqual({
      backgroundImage: 'url("/a.webp")',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
    });
  });

  it('skips the background image until its url is known', () => {
    expect(
      stylingToCss(theme, {
        backgroundImage: 'image-1',
        backgroundSize: 'auto',
      })
    ).toEqual({});
  });

  it('lays the overlay over the background image', () => {
    const overlay = `color-mix(in srgb, ${theme.palette.secondary.main} 40%, transparent)`;

    expect(
      stylingToCss(
        theme,
        {
          backgroundImage: 'image-1',
          overlay: 'secondary.main',
          overlayOpacity: 40,
        },
        { backgroundImageUrl: '/a.webp' }
      )
    ).toMatchObject({
      backgroundImage: `linear-gradient(${overlay}, ${overlay}), url("/a.webp")`,
    });
  });

  it('tints the background colour with the overlay at half opacity by default', () => {
    const overlay = 'color-mix(in srgb, #000000 50%, transparent)';

    expect(stylingToCss(theme, { overlay: '#000000' })).toEqual({
      backgroundImage: `linear-gradient(${overlay}, ${overlay})`,
    });
  });

  it('rounds the corners in theme radius multiples or pixels', () => {
    expect(
      stylingToCss(createTheme({ shape: { borderRadius: 6 } }), {
        borderRadius: { topLeft: 2, bottomRight: '3px' },
      })
    ).toEqual({
      borderTopLeftRadius: '12px',
      borderBottomRightRadius: '3px',
    });
  });

  it('limits the size', () => {
    expect(stylingToCss(theme, { minHeight: '50vh', maxWidth: '80%' })).toEqual(
      {
        minHeight: '50vh',
        maxWidth: '80%',
      }
    );
  });

  it('uses the breakpoint width as maximum width', () => {
    expect(stylingToCss(theme, { maxWidth: 'md' })).toEqual({
      maxWidth: `${theme.breakpoints.values.md}px`,
    });
  });

  it('applies the theme shadow and the opacity', () => {
    expect(stylingToCss(theme, { shadow: 4, opacity: 80 })).toEqual({
      boxShadow: theme.shadows[4],
      opacity: 0.8,
    });
    expect(stylingToCss(theme, { shadow: 0, opacity: 0 })).toEqual({
      boxShadow: theme.shadows[0],
      opacity: 0,
    });
  });

  it('ignores shadows the theme does not define', () => {
    expect(stylingToCss(theme, { shadow: 40 })).toEqual({});
  });

  it('renders nothing without a styling', () => {
    expect(stylingToCss(theme, null)).toEqual({});
    expect(stylingToCss(theme, undefined)).toEqual({});
  });

  it('treats the nulls GraphQL returns like unset values', () => {
    const fromGraphQL = {
      __typename: 'PuckBlockStyling',
      typography: null,
      textAlign: 'center',
      color: null,
      fontWeight: null,
      textTransform: 'uppercase',
      background: null,
      backgroundImage: null,
      backgroundSize: null,
      backgroundPosition: null,
      overlay: null,
      overlayOpacity: null,
      margin: {
        __typename: 'PuckSpacingSides',
        top: 2,
        right: null,
        bottom: null,
        left: null,
      },
      padding: null,
      border: {
        __typename: 'PuckBorder',
        style: null,
        color: null,
        width: {
          __typename: 'PuckBorderWidth',
          top: null,
          right: null,
          bottom: 1,
          left: null,
        },
      },
      borderRadius: {
        __typename: 'PuckBorderRadius',
        topLeft: null,
        topRight: null,
        bottomRight: null,
        bottomLeft: null,
      },
      minHeight: null,
      maxWidth: null,
      shadow: null,
      opacity: null,
      backgroundImageObject: null,
    } as const;

    expect(stylingToCss(theme, fromGraphQL)).toEqual({
      textAlign: 'center',
      textTransform: 'uppercase',
      borderBottom: '1px solid currentColor',
      marginTop: theme.spacing(2),
    });
  });

  it('draws the background image GraphQL resolved, preferring its large version', () => {
    expect(
      stylingToCss(theme, {
        backgroundImage: 'image-1',
        backgroundImageObject: {
          url: '/original.jpg',
          xxl: '/xxl.webp',
        },
      })
    ).toMatchObject({ backgroundImage: 'url("/xxl.webp")' });
    expect(
      stylingToCss(theme, {
        backgroundImage: 'image-1',
        backgroundImageObject: { url: '/original.jpg' },
      })
    ).toMatchObject({ backgroundImage: 'url("/original.jpg")' });
  });

  it('lets the given background image url win over the resolved image', () => {
    expect(
      stylingToCss(
        theme,
        {
          backgroundImage: 'image-1',
          backgroundImageObject: { url: '/original.jpg', xxl: '/xxl.webp' },
        },
        { backgroundImageUrl: '/editor.webp' }
      )
    ).toMatchObject({ backgroundImage: 'url("/editor.webp")' });
  });

  it('accepts the styling types of the website API', () => {
    type Styling = Parameters<typeof stylingToCss>[1];

    expectTypeOf<PuckBlockStyling>().toExtend<Styling>();
    expectTypeOf<FullPuckBlockFragment['styling']>().toExtend<Styling>();
    expectTypeOf<null>().toExtend<Styling>();
    expectTypeOf<undefined>().toExtend<Styling>();
    expectTypeOf<{
      marginSides: ['top', 'bottom'];
    }>().toExtend<StylingToCssOptions>();
  });
});

describe('puckBackgroundImageUrl', () => {
  it('prefers the given url, then the large and then the original image', () => {
    const backgroundImageObject = { url: '/original.jpg', xxl: '/xxl.webp' };

    expect(
      puckBackgroundImageUrl(
        { backgroundImageObject },
        { backgroundImageUrl: '/editor.webp' }
      )
    ).toBe('/editor.webp');
    expect(puckBackgroundImageUrl({ backgroundImageObject })).toBe('/xxl.webp');
    expect(
      puckBackgroundImageUrl({
        backgroundImageObject: { url: '/original.jpg', xxl: null },
      })
    ).toBe('/original.jpg');
    expect(puckBackgroundImageUrl({ backgroundImageObject: null })).toBe(
      undefined
    );
    expect(puckBackgroundImageUrl(undefined)).toBeUndefined();
  });
});
