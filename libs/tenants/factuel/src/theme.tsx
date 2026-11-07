import { createTheme, ThemeOptions } from '@mui/material/styles';

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
      h1: { ...heading, fontSize: headings.page.h1 },
      h2: { ...heading, fontSize: headings.page.h2 },
      h3: { ...heading, fontSize: headings.page.h3 },
      h4: { ...heading, fontSize: headings.page.h4 },
      h5: { ...heading, fontSize: headings.page.h5 },
      h6: { ...ui, fontSize: headings.page.h6 },
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
      MuiInputAdornment: {
        styleOverrides: { positionStart: { flexShrink: 0 } },
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
