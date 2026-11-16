import { alpha, createTheme, ThemeOptions } from '@mui/material/styles';

import { CourantColorOverrides, courantColors } from './brand-colors';
import { courantTokens, CourantTypographyRole } from './brand-tokens';
import { colorValue, resolveCourantPalette } from './theme-colors';

const { typography, shape, button } = courantTokens;
const { sizes, headings, leading, weights } = typography;
const space = (units: number) => `${courantTokens.spacing * units}px`;

const themeOptions = (colors: CourantColorOverrides): ThemeOptions => {
  const role = (name: CourantTypographyRole) => ({
    fontFamily: typography.roles[name].fontFamily,
    fontWeight: `var(--courant-${name}-weight)` as const,
    lineHeight: `var(--courant-${name}-lh)`,
    letterSpacing: `var(--courant-${name}-tracking)`,
    color: colorValue(colors.typography?.[name]?.color),
    backgroundColor: colorValue(colors.typography?.[name]?.backgroundColor),
  });
  const heading = role('heading');
  const body = role('body');
  const editorial = role('editorial');
  const ui = role('ui');
  const caption = role('caption');
  const kicker = { ...role('kicker'), textTransform: 'uppercase' as const };

  // Leads and page paragraphs use the sans role
  // article richtext supplies has own serif (!= titles)
  // Emphasis uses custom CSS-based highlighting effect instead of italic
  const highlightColor =
    colorValue(colors.palette?.primary?.main) ??
    courantTokens.colors.courant[500];
  const textContent = {
    letterSpacing: 0,
    lineHeight: 1.2,
    fontWeight: weights.medium,
    '& em, em': {
      fontStyle: 'normal',
      background: `linear-gradient(transparent 15%, ${highlightColor} 15%, ${highlightColor} 85%, transparent 85%)`,
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
      padding: '0 .15em',
      margin: '0 -.15em',
    },
  } as const;

  return {
    spacing: courantTokens.spacing,
    breakpoints: { values: { ...courantTokens.breakpoints } },
    shape: { borderRadius: shape.borderRadius },
    typography: {
      fontFamily: body.fontFamily,
      fontSize: typography.fontSize,
      htmlFontSize: typography.htmlFontSize,
      fontWeightLight: weights.light,
      fontWeightRegular: weights.regular,
      fontWeightMedium: weights.medium,
      fontWeightBold: weights.bold,
      allVariants: body,
      h1: {
        ...heading,
        fontSize: headings.page.h1,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      h2: {
        ...heading,
        fontSize: headings.page.h2,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      h3: {
        ...heading,
        fontSize: headings.page.h3,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      h4: {
        ...heading,
        fontSize: headings.page.h4,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      h5: {
        ...heading,
        fontSize: headings.page.h5,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      h6: {
        ...ui,
        fontSize: headings.page.h6,
        hyphens: 'none',
        textWrap: 'balance',
        wordBreak: 'keep-all',
      },
      subtitle1: {
        ...body,
        ...textContent,
        fontSize: sizes.subtitle1,
      },
      subtitle2: { ...ui, fontSize: sizes.subtitle2 },
      body1: {
        ...body,
        ...textContent,
        fontSize: sizes.body1,
        hyphens: 'none',
        textWrap: 'pretty',
        '&.MuiTypography-gutterBottom': {
          marginBottom: space(typography.spacing.bodyBottom),
        },
        '&:is(li).MuiTypography-gutterBottom': {
          marginBottom: space(typography.spacing.listItemBottom),
        },
      },
      body2: { ...body, fontSize: sizes.body2 },
      button: { ...ui, fontSize: sizes.button, textTransform: 'none' },
      caption: { ...caption, fontSize: sizes.caption },
      overline: { ...kicker, fontSize: sizes.overline },
      teaserTitle: {
        ...heading,
        fontSize: sizes.teaserTitle,
        marginBottom: typography.spacing.teaserTitleBottom,
      },
      teaserPretitle: {
        ...kicker,
        fontSize: sizes.teaserPretitle,
        padding: typography.spacing.teaserPretitlePadding,
        color: colorValue(colors.teaserLabel?.color) ?? kicker.color,
        backgroundColor:
          colorValue(colors.teaserLabel?.backgroundColor) ??
          kicker.backgroundColor,
      },
      teaserLead: {
        ...editorial,
        fontSize: sizes.teaserLead,
        marginBottom: space(typography.spacing.teaserLeadBottom),
      },
      teaserMeta: { ...caption, fontSize: sizes.teaserMeta },
      articleAuthors: { ...ui, fontSize: sizes.articleAuthors },
      peerInformation: { ...body, fontSize: sizes.peerInformation },
      blockBreakTitle: { ...heading, fontSize: sizes.blockBreakTitle },
      blockBreakBody: { ...body, fontSize: sizes.blockBreakBody },
      blockQuote: { ...heading, fontSize: sizes.blockQuote },
      blockTitlePreTitle: { ...kicker, fontSize: sizes.blockTitlePreTitle },
      bannerTitle: { ...heading, fontSize: sizes.bannerTitle },
      bannerText: { ...body, fontSize: sizes.bannerText },
      bannerCta: {
        ...ui,
        fontSize: sizes.bannerCta,
        lineHeight: leading.bannerCta,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'initial',
            boxShadow: 'none',
            borderRadius: shape.buttonRadiusFallback,
            '@supports (corner-shape: squircle)': {
              borderRadius: shape.buttonRadius,
              cornerShape: shape.buttonCornerShape,
            },
            color: ui.color,
            backgroundColor: ui.backgroundColor,
            transition: theme.transitions.create(
              [
                'background-color',
                'color',
                'border-color',
                'box-shadow',
                'transform',
              ],
              { duration: button.transitionMs }
            ),
            '.MuiButton-startIcon': { marginRight: space(button.iconGap) },
            '.MuiButton-endIcon': { marginLeft: space(button.iconGap) },
            ':hover': {
              boxShadow: 'none',
              transform: `translateY(${button.hoverLift})`,
            },
            ':active': { transform: 'translateY(0)' },
            ':focus-visible': {
              outline: `${button.focusRingWidth} solid ${theme.palette.primary.main}`,
              outlineOffset: button.focusRingOffset,
            },
            '&.Mui-disabled': { opacity: button.disabledOpacity },
            variants: [
              {
                props: { size: 'small' },
                style: {
                  padding: `${space(button.padding.small.y)} ${space(button.padding.small.x)}`,
                },
              },
              {
                props: { size: 'medium' },
                style: {
                  padding: `${space(button.padding.medium.y)} ${space(button.padding.medium.x)}`,
                },
              },
              {
                props: { size: 'large' },
                style: {
                  padding: `${space(button.padding.large.y)} ${space(button.padding.large.x)}`,
                },
              },
              {
                props: { variant: 'contained' },
                style: { fontWeight: weights.bold },
              },
              {
                props: { variant: 'outlined', color: 'secondary' },
                style: ({ theme }) => ({
                  color: ui.color ?? theme.palette.common.white,
                  borderColor: 'currentcolor',
                  borderWidth: shape.outlinedButtonBorder,
                  ':hover': {
                    borderWidth: shape.outlinedButtonBorder,
                    borderColor: 'currentcolor',
                  },
                }),
              },
              {
                props: { variant: 'contained', color: 'secondary' },
                style: ({ theme }) => ({
                  backgroundColor:
                    ui.backgroundColor ?? theme.palette.common.white,
                  color: ui.color ?? theme.palette.common.black,
                  ':hover': {
                    backgroundColor:
                      ui.backgroundColor ?? theme.palette.common.white,
                    boxShadow: 'none',
                  },
                }),
              },
            ],
          }),
        },
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: 'inherit',
            textDecorationColor: theme.palette.primary.main,
            textDecorationThickness: '1px',
            textDecorationSkipInk: 'auto',
            textUnderlineOffset: '0.1em',
            ':hover': {
              textDecorationColor: courantTokens.colors.warmGray[400],
            },
          }),
        },
      },
      MuiInputAdornment: {
        styleOverrides: { positionStart: { flexShrink: 0 } },
      },
      MuiTextField: {
        defaultProps: { variant: 'filled' },
      },
      MuiFilledInput: {
        defaultProps: { disableUnderline: true },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: courantTokens.colors.warmGray[50],
            border: `1px solid ${courantTokens.colors.warmGray[100]}`,
            borderRadius: shape.borderRadius,
            overflow: 'hidden',
            transition: theme.transitions.create([
              'background-color',
              'border-color',
              'box-shadow',
            ]),
            '&:hover': {
              backgroundColor: courantTokens.colors.warmGray[50],
              borderColor: courantTokens.colors.warmGray[200],
            },
            '&.Mui-focused': {
              backgroundColor: courantTokens.colors.warmGray[50],
              borderColor: courantTokens.colors.courant[500],
              boxShadow: `0 0 0 2px ${alpha(courantTokens.colors.courant[500], 0.4)}`,
            },
            '&.Mui-error': {
              borderColor: theme.palette.error.main,
            },
            '&.Mui-error.Mui-focused': {
              boxShadow: `0 0 0 2px ${alpha(theme.palette.error.main, 0.3)}`,
            },
            '&.Mui-disabled': {
              backgroundColor: courantTokens.colors.warmGray[50],
              opacity: 0.6,
            },
          }),
          input: {
            fontSize: '1rem',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: typography.roles.caption.fontFamily,
            fontSize: '1rem',
            lineHeight: 1,
            letterSpacing: typography.roles.caption.letterSpacing,
            fontWeight: typography.roles.caption.fontWeight,
            color: courantTokens.colors.warmGray[700],
            '&.Mui-focused': { color: courantTokens.colors.warmGray[700] },
          },
          filled: {
            '&:not(.MuiInputLabel-shrink)': {
              transform: 'translate(12px, 20px) scale(1)',
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontFamily: typography.roles.caption.fontFamily,
            fontSize: typography.sizes.caption,
            letterSpacing: typography.roles.caption.letterSpacing,
            lineHeight: typography.roles.caption.lineHeight,
            marginLeft: 0,
            marginRight: 0,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: '#fff',
            borderRadius: shape.borderRadius,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: '#fff',
            borderRadius: shape.borderRadius,
          },
          option: {
            fontSize: '1rem',
            fontWeight: 500,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: theme => ({
          '.courant-profile-page': {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(16),
          },
          '.courant-profile-page :is(.MuiTypography-h4, .MuiTypography-h5)': {
            ...heading,
            fontSize: headings.page.h2,
          },
          '.courant-profile-page :has(> .MuiTypography-h4, > .MuiTypography-h5)':
            {
              rowGap: theme.spacing(5),
            },
        }),
      },
      MuiContainer: {
        styleOverrides: {
          root: ({ theme }) => {
            const { pageInline } = courantTokens.layout;
            return {
              paddingInline: theme.spacing(pageInline.xs),
              [theme.breakpoints.up('sm')]: {
                paddingInline: theme.spacing(pageInline.sm),
              },
              [theme.breakpoints.up('md')]: {
                paddingInline: theme.spacing(pageInline.md),
              },
              [theme.breakpoints.up('lg')]: {
                paddingInline: theme.spacing(pageInline.lg),
              },
            };
          },
        },
      },
    },
  };
};

export const createCourantTheme = (
  settingsTheme?: ThemeOptions,
  colorOverrides: CourantColorOverrides = courantColors
) =>
  createTheme({
    ...themeOptions(colorOverrides),
    palette: resolveCourantPalette(
      settingsTheme?.palette,
      colorOverrides.palette
    ),
  });

const theme: ThemeOptions = {
  ...themeOptions(courantColors),
  palette: resolveCourantPalette(undefined, courantColors.palette),
};

export { theme as default };
