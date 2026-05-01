import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Inter_Tight } from 'next/font/google';
import { PartialDeep } from 'type-fest';

// Single-font system — locked to Inter Tight site-wide per v2 design (2026-04-30).
// All 44 typography variants in this theme distinguish by size / weight / line-height /
// letter-spacing / text-transform alone — never by family.
const interTight = Inter_Tight({
  weight: ['300', '400', '500', '600', '700'],
  style: ['italic', 'normal'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const fontFamily = [
  interTight.style.fontFamily,
  'system-ui',
  'sans-serif',
].join(',');

// v2 palette tokens (canonical "ink-paper" — Q18 ships this only initially).
const colors = {
  ink: '#0e2a3b',
  inkSoft: '#2b4a5c',
  paper: '#f5f0e6',
  paperWarm: '#ede5d3',
  section: '#e8ecdf',
  accent: '#c8e26d',
  accentDeep: '#9bb84a',
  highlight: '#f3c969',
  bodyText: '#161616',
  rule: 'rgba(14,42,59,0.18)',
  ruleStrong: 'rgba(14,42,59,0.55)',
  alert: '#c1361b',
  alertDeep: '#8a2010',
  alertSoft: '#f8e0db',
} as const;

// Reusable typography variant builders — keep size/weight/letterSpacing
// concerns explicit to make the variant table easy to scan and amend.
const display = (
  fontSize: string,
  lineHeight: number,
  weight = 400,
  letterSpacing = '-0.02em'
) => ({
  fontFamily,
  fontSize,
  fontWeight: weight,
  lineHeight,
  letterSpacing,
});

const body = (fontSize: string, lineHeight: number, weight = 400) => ({
  fontFamily,
  fontSize,
  fontWeight: weight,
  lineHeight,
});

const ui = (fontSize: string, weight = 500, lineHeight = 1) => ({
  fontFamily,
  fontSize,
  fontWeight: weight,
  lineHeight,
});

const meta = (fontSize: string, letterSpacing: string, weight = 400) => ({
  fontFamily,
  fontSize,
  fontWeight: weight,
  lineHeight: 1,
  letterSpacing,
  textTransform: 'uppercase' as const,
});

const theme = createTheme(WePTheme, {
  palette: {
    primary: { main: colors.ink, contrastText: colors.paper },
    secondary: { main: colors.accentDeep, contrastText: colors.ink },
    background: { default: colors.paper, paper: colors.section },
    text: { primary: colors.ink, secondary: colors.inkSoft },
    divider: colors.rule,
  },
  typography: {
    fontFamily,
    // ----- 18 display variants (headlines + brand wordmark) -----
    displayPageH1: display('clamp(48px, 6vw, 96px)', 0.95, 400, '-0.03em'),
    displayMitmachenH1: display(
      'clamp(64px, 9vw, 144px)',
      0.92,
      350,
      '-0.025em'
    ),
    displayTopicH1: display('clamp(56px, 9vw, 132px)', 0.92, 350, '-0.02em'),
    displayArticleH1: display('clamp(40px, 5.2vw, 76px)', 0.96, 400, '-0.02em'),
    displaySearchH1: display('clamp(48px, 7vw, 96px)', 0.95, 350, '-0.03em'),
    displayFeaturedTeaser: display(
      'clamp(36px, 4.4vw, 64px)',
      1,
      400,
      '-0.02em'
    ),
    displayFeatureH2: display('clamp(36px, 4.2vw, 56px)', 1.02, 400, '-0.01em'),
    displaySection: display('clamp(32px, 3.4vw, 44px)', 1, 400, '-0.02em'),
    displayMenuOverlay: display('clamp(36px, 4vw, 56px)', 0.98, 400, '-0.02em'),
    displayNewsletter: display('clamp(28px, 3vw, 40px)', 1.05, 400, '-0.02em'),
    displayLogo: display('34px', 1, 500, '-0.04em'),
    displayLogoCompact: display('28px', 1, 500, '-0.04em'),
    displayTopicCard: display('36px', 1, 400, '-0.02em'),
    displayTeaserMd: display('24px', 1.05, 400, '-0.02em'),
    displayTeaserLg: display('32px', 1.05, 400, '-0.02em'),
    displayTeaserCompact: display('20px', 1.15, 400, '-0.02em'),
    displayArticleH2: display('28px', 1.15, 500, '-0.02em'),
    displayStatNum: display('36px', 1, 400, '-0.01em'),
    // ----- 8 body variants (long-form reading + leads) -----
    bodyLeadXl: body('clamp(18px, 1.4vw, 22px)', 1.5, 300),
    bodyLead: body('21px', 1.5, 300),
    bodyDefault: body('19px', 1.65, 400),
    bodyTopicDesc: body('19px', 1.5, 300),
    bodyTeaserStandard: body('15px', 1.5, 400),
    bodyTeaserFeatured: body('18px', 1.5, 400),
    bodyFooterDesc: body('16px', 1.5, 400),
    bodyCallout: body('18px', 1.5, 400),
    // ----- 12 UI / chrome / form variants -----
    uiBtnPrimary: ui('14px', 500, 1),
    uiBtnAccent: ui('14px', 500, 1),
    uiBtnGhost: ui('14px', 500, 1),
    uiPillBtn: ui('14px', 500, 1),
    uiActionLink: ui('14px', 500, 1),
    uiNavLinkPrimary: ui('18px', 500, 1.3),
    uiNavLinkSecondary: ui('14px', 400, 1.3),
    uiTopbarLink: { ...ui('13px', 500, 1.4), letterSpacing: '0.02em' as const },
    uiFooterLink: ui('15px', 400, 1.4),
    uiByLineName: ui('14px', 500, 1.3),
    uiInputDefault: ui('15px', 400, 1.4),
    uiInputXl: ui('18px', 400, 1),
    // ----- 6 meta / chip variants (uppercase, tracked) -----
    metaEyebrow: meta('12px', '0.12em'),
    metaEyebrowSmall: meta('11px', '0.08em'),
    metaLabel: meta('11px', '0.10em'),
    metaChip: meta('11px', '0.10em'),
    metaListIndex: { ...ui('13px', 500, 1) }, // not uppercase — just numerals
    metaInline: { ...ui('13px', 500, 1.4), letterSpacing: '0.02em' as const },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.paper,
          color: colors.ink,
        },
        // NOTE: there is no global `[class*="TeaserSlotsBlockTeasers"]` rule
        // here. That selector relies on Emotion's display-name being kept in
        // the generated class — which dev does (autoLabel: 'dev-only')
        // but production strips. The grid override now lives inside the
        // component wrappers (`EenewsTeaserSlots`, `EenewsBlockRenderer` for
        // TeaserList) using Emotion's `${StyledComponent}` selector, which
        // resolves to the runtime class regardless of label stripping.
        // See anti-pattern #21k in wepublish-redesign-patterns.md.
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none' as const,
          fontFamily,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1,
        },
      },
      variants: [
        {
          props: { variant: 'v2-btn-primary' } as any,
          style: {
            background: colors.ink,
            color: colors.paper,
            padding: '12px 20px',
            border: 0,
            '&:hover': { background: colors.inkSoft },
          },
        },
        {
          props: { variant: 'v2-btn-accent' } as any,
          style: {
            background: colors.accent,
            color: colors.ink,
            padding: '10px 20px',
            border: 0,
            fontWeight: 600,
            '&:hover': { background: colors.accentDeep },
          },
        },
        {
          props: { variant: 'v2-btn-ghost' } as any,
          style: {
            background: 'transparent',
            color: colors.ink,
            padding: '12px 20px',
            border: `1px solid ${colors.ruleStrong}`,
            '&:hover': { background: 'rgba(14,42,59,0.05)' },
          },
        },
        {
          props: { variant: 'v2-pillbtn' } as any,
          style: {
            background: 'transparent',
            color: colors.ink,
            padding: '10px 14px',
            height: 40,
            border: `1px solid ${colors.ruleStrong}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            '&:hover': { background: 'rgba(14,42,59,0.05)' },
            '&.active, &[aria-pressed="true"]': {
              background: colors.ink,
              color: colors.paper,
              borderColor: colors.ink,
            },
          },
        },
      ],
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: 1360,
          paddingLeft: 32,
          paddingRight: 32,
          '@media (max-width: 800px)': {
            paddingLeft: 20,
            paddingRight: 20,
          },
        },
      },
    },
  },
} as PartialDeep<Theme> | ThemeOptions);

export { theme as default, colors as eenewsColors };
