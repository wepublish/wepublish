import { createTheme, Theme, ThemeOptions } from '@mui/material';
import { theme as WePTheme } from '@wepublish/ui';
import { Manrope, Source_Serif_4 } from 'next/font/google';
import { PartialDeep } from 'type-fest';

const manrope = Manrope({
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
});

const sourceSerif = Source_Serif_4({
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
});

const sans = [manrope.style.fontFamily, 'system-ui', 'sans-serif'].join(',');
const serif = [
  sourceSerif.style.fontFamily,
  '"Source Serif Pro"',
  'Georgia',
  'serif',
].join(',');

export const eenewsColors = {
  accent: '#195a7d',
  accentDark: '#103f5a',
  tag: '#baf09c',
  bg: '#f8fff5',
  bgAlt: '#f0faff',
  line: 'rgba(25, 90, 125, 0.18)',
  text: '#0e1116',
  muted: '#5b6770',
  alert: '#c1361b',
  alertSoft: '#f8e0db',
  alertDeep: '#8a2010',
  white: '#ffffff',
} as const;

const heading = (
  fontSize: string,
  lineHeight: number,
  weight: number,
  letterSpacing: string | undefined
): React.CSSProperties => ({
  fontFamily: sans,
  fontSize,
  fontWeight: weight,
  lineHeight,
  ...(letterSpacing ? { letterSpacing } : {}),
});

const body = (
  fontSize: string,
  lineHeight: number,
  weight = 400
): React.CSSProperties => ({
  fontFamily: serif,
  fontSize,
  fontWeight: weight,
  lineHeight,
});

const ui = (
  fontSize: string,
  weight: number,
  lineHeight = 1,
  letterSpacing?: string,
  uppercase = false
): React.CSSProperties => ({
  fontFamily: sans,
  fontSize,
  fontWeight: weight,
  lineHeight,
  ...(letterSpacing ? { letterSpacing } : {}),
  ...(uppercase ? { textTransform: 'uppercase' as const } : {}),
});

const theme = createTheme(WePTheme, {
  palette: {
    primary: { main: eenewsColors.accent, contrastText: eenewsColors.white },
    secondary: { main: eenewsColors.tag, contrastText: eenewsColors.accent },
    background: {
      default: eenewsColors.bg,
      paper: eenewsColors.white,
    },
    text: {
      primary: eenewsColors.text,
      secondary: eenewsColors.muted,
    },
    divider: eenewsColors.line,
    error: { main: eenewsColors.alert, dark: eenewsColors.alertDeep },
  },
  typography: {
    fontFamily: sans,
    h1: {
      ...heading('clamp(40px, 5vw, 64px)', 1.04, 800, '-0.025em'),
      color: eenewsColors.accent,
    },
    h2: {
      ...heading('clamp(30px, 4vw, 38px)', 1, 800, '-0.02em'),
      color: eenewsColors.accent,
    },
    h3: {
      ...heading('26px', 1.12, 800, '-0.018em'),
      color: eenewsColors.accent,
    },
    h4: { ...heading('22px', 1.2, 700, '-0.01em'), color: eenewsColors.accent },
    h5: { ...heading('19px', 1.3, 700, undefined), color: eenewsColors.accent },
    h6: { ...heading('17px', 1.4, 700, undefined), color: eenewsColors.accent },
    body1: { fontFamily: serif, fontSize: '18px', lineHeight: 1.65 },
    body2: { fontFamily: serif, fontSize: '16px', lineHeight: 1.5 },
    button: { fontFamily: sans, fontWeight: 700 },
    caption: { fontFamily: sans, fontSize: '14px', lineHeight: 1.4 },
    overline: { fontFamily: sans, fontSize: '12px', letterSpacing: '0.08em' },
    subtitle1: { fontFamily: sans, fontSize: '17px', lineHeight: 1.4 },
    subtitle2: { fontFamily: sans, fontSize: '15px', lineHeight: 1.4 },
    pageH1Standard: heading('clamp(40px, 5vw, 64px)', 1.04, 800, '-0.025em'),
    pageH1XL: heading('clamp(48px, 7vw, 96px)', 0.96, 800, '-0.03em'),
    pageH1Mega: heading('clamp(56px, 8vw, 112px)', 1, 400, '-0.02em'),
    pageEyebrow: ui('14px', 700, 1, '0.08em', true),
    pageLead: body('19px', 1.5, 400),
    pageCrumb: ui('14px', 600, 1, '0.06em', true),
    sectionTitle: heading('clamp(30px, 4vw, 38px)', 1, 800, '-0.02em'),
    sectionToggle: ui('19px', 400, 1),
    sectionLink: ui('19px', 400, 1),
    articleTitle: heading('clamp(36px, 5vw, 52px)', 1.05, 800, '-0.025em'),
    articleEyebrow: ui('14px', 700, 1, '0.03em', true),
    articleLeadTop: heading('22px', 1.4, 600, '-0.005em'),
    articleH2: heading('26px', 1.2, 800, '-0.018em'),
    articleLead: heading('22px', 1.35, 700, '-0.01em'),
    articleBlockPreTitle: ui('13px', 700, 1, '0.06em', true),
    articleBody: body('18px', 1.65, 400),
    articleQuote: { ...body('22px', 1.4, 400), fontStyle: 'italic' as const },
    articleQuoteCite: ui('14px', 400, 1),
    articleSupport: heading('19px', 1.35, 700, undefined),
    articleCaption: ui('14px', 400, 1.4),
    teaserTitle: heading('26px', 1.12, 800, '-0.018em'),
    teaserMeta: ui('14px', 700, 1),
    teaserExcerpt: body('16px', 1.5, 400),
    teaserTagChip: ui('14px', 600, 1, '0.005em'),
    teaserBadge: ui('12px', 700, 1, '0.04em', true),
    navPrimary: heading('28px', 1, 300, '-0.005em'),
    topbarLink: ui('15px', 500, 1),
    topbarDate: ui('15px', 500, 1),
    topbarInvoicePill: ui('13px', 700, 1, '0.02em'),
    megaCol: heading('22px', 1, 700, '-0.01em'),
    megaItem: ui('20px', 300, 2.1),
    megaItemSecondary: ui('17px', 300, 1.4),
    footerCol: ui('15px', 700, 1, '0.02em', true),
    footerLink: ui('15px', 400, 1.4),
    footerTag: ui('14px', 400, 1.5),
    inputLabel: ui('13px', 700, 1, '0.02em'),
    btnDefault: ui('15px', 700, 1),
    supportBtn: ui('17px', 700, 1),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: eenewsColors.bg,
          color: eenewsColors.text,
          fontFamily: sans,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          pageH1Standard: 'h1',
          pageH1XL: 'h1',
          pageH1Mega: 'h1',
          sectionTitle: 'h2',
          articleTitle: 'h1',
          articleH2: 'h2',
          teaserTitle: 'h3',
          megaCol: 'h4',
          footerCol: 'h4',
          pageLead: 'p',
          pageEyebrow: 'span',
          pageCrumb: 'span',
          articleEyebrow: 'span',
          articleLeadTop: 'p',
          articleLead: 'p',
          articleBlockPreTitle: 'p',
          articleBody: 'p',
          articleQuote: 'p',
          articleQuoteCite: 'cite',
          articleSupport: 'p',
          articleCaption: 'figcaption',
          teaserMeta: 'div',
          teaserExcerpt: 'p',
          teaserTagChip: 'span',
          teaserBadge: 'span',
          navPrimary: 'span',
          topbarLink: 'span',
          topbarDate: 'span',
          topbarInvoicePill: 'span',
          megaItem: 'span',
          megaItemSecondary: 'span',
          footerLink: 'span',
          footerTag: 'p',
          inputLabel: 'label',
          btnDefault: 'span',
          supportBtn: 'span',
          sectionToggle: 'span',
          sectionLink: 'span',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: sans,
          textTransform: 'none' as const,
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 15,
          padding: '10px 20px',
        },
      },
      variants: [
        {
          props: { variant: 'ee-primary' } as any,
          style: {
            background: eenewsColors.accent,
            color: eenewsColors.white,
            '&:hover': { background: eenewsColors.accentDark },
          },
        },
        {
          props: { variant: 'ee-ghost' } as any,
          style: {
            background: 'transparent',
            color: eenewsColors.accent,
            border: `2px solid ${eenewsColors.accent}`,
            '&:hover': {
              background: eenewsColors.accent,
              color: eenewsColors.white,
            },
          },
        },
        {
          props: { variant: 'ee-tag' } as any,
          style: {
            background: eenewsColors.tag,
            color: eenewsColors.accent,
            '&:hover': {
              background: eenewsColors.accent,
              color: eenewsColors.tag,
            },
          },
        },
        {
          props: { variant: 'ee-alert' } as any,
          style: {
            background: eenewsColors.alert,
            color: eenewsColors.white,
            '&:hover': { background: eenewsColors.alertDeep },
          },
        },
      ],
    },
  },
} as unknown as PartialDeep<Theme> | ThemeOptions);

export { theme as default };
