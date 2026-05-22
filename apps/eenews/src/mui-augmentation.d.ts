// Type augmentation for ee-news typography + button variants.
// See system design §3 (38 typography variants) and §5 button variants in theme.tsx.

import { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    // Page-level H1
    pageH1Standard: CSSProperties;
    pageH1XL: CSSProperties;
    pageH1Mega: CSSProperties;
    // Page intro support
    pageEyebrow: CSSProperties;
    pageLead: CSSProperties;
    pageCrumb: CSSProperties;
    // Section heads
    sectionTitle: CSSProperties;
    sectionToggle: CSSProperties;
    sectionLink: CSSProperties;
    // Article detail
    articleTitle: CSSProperties;
    articleEyebrow: CSSProperties;
    articleLeadTop: CSSProperties;
    articleH2: CSSProperties;
    articleLead: CSSProperties;
    articleBlockPreTitle: CSSProperties;
    articleBody: CSSProperties;
    articleQuote: CSSProperties;
    articleQuoteCite: CSSProperties;
    articleSupport: CSSProperties;
    articleCaption: CSSProperties;
    // Teaser card
    teaserTitle: CSSProperties;
    teaserMeta: CSSProperties;
    teaserExcerpt: CSSProperties;
    teaserTagChip: CSSProperties;
    teaserBadge: CSSProperties;
    // Nav / topbar
    navPrimary: CSSProperties;
    topbarLink: CSSProperties;
    topbarDate: CSSProperties;
    topbarInvoicePill: CSSProperties;
    megaCol: CSSProperties;
    megaItem: CSSProperties;
    megaItemSecondary: CSSProperties;
    // Footer
    footerCol: CSSProperties;
    footerLink: CSSProperties;
    footerTag: CSSProperties;
    // UI / forms
    inputLabel: CSSProperties;
    btnDefault: CSSProperties;
    supportBtn: CSSProperties;
  }

  interface TypographyVariantsOptions {
    pageH1Standard?: CSSProperties;
    pageH1XL?: CSSProperties;
    pageH1Mega?: CSSProperties;
    pageEyebrow?: CSSProperties;
    pageLead?: CSSProperties;
    pageCrumb?: CSSProperties;
    sectionTitle?: CSSProperties;
    sectionToggle?: CSSProperties;
    sectionLink?: CSSProperties;
    articleTitle?: CSSProperties;
    articleEyebrow?: CSSProperties;
    articleLeadTop?: CSSProperties;
    articleH2?: CSSProperties;
    articleLead?: CSSProperties;
    articleBlockPreTitle?: CSSProperties;
    articleBody?: CSSProperties;
    articleQuote?: CSSProperties;
    articleQuoteCite?: CSSProperties;
    articleSupport?: CSSProperties;
    articleCaption?: CSSProperties;
    teaserTitle?: CSSProperties;
    teaserMeta?: CSSProperties;
    teaserExcerpt?: CSSProperties;
    teaserTagChip?: CSSProperties;
    teaserBadge?: CSSProperties;
    navPrimary?: CSSProperties;
    topbarLink?: CSSProperties;
    topbarDate?: CSSProperties;
    topbarInvoicePill?: CSSProperties;
    megaCol?: CSSProperties;
    megaItem?: CSSProperties;
    megaItemSecondary?: CSSProperties;
    footerCol?: CSSProperties;
    footerLink?: CSSProperties;
    footerTag?: CSSProperties;
    inputLabel?: CSSProperties;
    btnDefault?: CSSProperties;
    supportBtn?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    pageH1Standard: true;
    pageH1XL: true;
    pageH1Mega: true;
    pageEyebrow: true;
    pageLead: true;
    pageCrumb: true;
    sectionTitle: true;
    sectionToggle: true;
    sectionLink: true;
    articleTitle: true;
    articleEyebrow: true;
    articleLeadTop: true;
    articleH2: true;
    articleLead: true;
    articleBlockPreTitle: true;
    articleBody: true;
    articleQuote: true;
    articleQuoteCite: true;
    articleSupport: true;
    articleCaption: true;
    teaserTitle: true;
    teaserMeta: true;
    teaserExcerpt: true;
    teaserTagChip: true;
    teaserBadge: true;
    navPrimary: true;
    topbarLink: true;
    topbarDate: true;
    topbarInvoicePill: true;
    megaCol: true;
    megaItem: true;
    megaItemSecondary: true;
    footerCol: true;
    footerLink: true;
    footerTag: true;
    inputLabel: true;
    btnDefault: true;
    supportBtn: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    'ee-primary': true;
    'ee-ghost': true;
    'ee-tag': true;
    'ee-alert': true;
  }
}
