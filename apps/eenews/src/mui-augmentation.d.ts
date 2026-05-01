// MUI type augmentation for EE News.
// All 44 typography variants + 4 button variants from the v2 system-design.
// See ~/.claude/projects/-Users-jpp-Git-wepublish-eenews/memory/eenews-system-design.md Section 3.

import type { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    // Display headlines
    displayPageH1: CSSProperties;
    displayMitmachenH1: CSSProperties;
    displayTopicH1: CSSProperties;
    displayArticleH1: CSSProperties;
    displaySearchH1: CSSProperties;
    displayFeaturedTeaser: CSSProperties;
    displayFeatureH2: CSSProperties;
    displaySection: CSSProperties;
    displayMenuOverlay: CSSProperties;
    displayNewsletter: CSSProperties;
    displayLogo: CSSProperties;
    displayLogoCompact: CSSProperties;
    displayTopicCard: CSSProperties;
    displayTeaserMd: CSSProperties;
    displayTeaserLg: CSSProperties;
    displayTeaserCompact: CSSProperties;
    displayArticleH2: CSSProperties;
    displayStatNum: CSSProperties;
    // Body
    bodyLeadXl: CSSProperties;
    bodyLead: CSSProperties;
    bodyDefault: CSSProperties;
    bodyTopicDesc: CSSProperties;
    bodyTeaserStandard: CSSProperties;
    bodyTeaserFeatured: CSSProperties;
    bodyFooterDesc: CSSProperties;
    bodyCallout: CSSProperties;
    // UI / chrome / form
    uiBtnPrimary: CSSProperties;
    uiBtnAccent: CSSProperties;
    uiBtnGhost: CSSProperties;
    uiPillBtn: CSSProperties;
    uiActionLink: CSSProperties;
    uiNavLinkPrimary: CSSProperties;
    uiNavLinkSecondary: CSSProperties;
    uiTopbarLink: CSSProperties;
    uiFooterLink: CSSProperties;
    uiByLineName: CSSProperties;
    uiInputDefault: CSSProperties;
    uiInputXl: CSSProperties;
    // Meta / chip
    metaEyebrow: CSSProperties;
    metaEyebrowSmall: CSSProperties;
    metaLabel: CSSProperties;
    metaChip: CSSProperties;
    metaListIndex: CSSProperties;
    metaInline: CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayPageH1?: CSSProperties;
    displayMitmachenH1?: CSSProperties;
    displayTopicH1?: CSSProperties;
    displayArticleH1?: CSSProperties;
    displaySearchH1?: CSSProperties;
    displayFeaturedTeaser?: CSSProperties;
    displayFeatureH2?: CSSProperties;
    displaySection?: CSSProperties;
    displayMenuOverlay?: CSSProperties;
    displayNewsletter?: CSSProperties;
    displayLogo?: CSSProperties;
    displayLogoCompact?: CSSProperties;
    displayTopicCard?: CSSProperties;
    displayTeaserMd?: CSSProperties;
    displayTeaserLg?: CSSProperties;
    displayTeaserCompact?: CSSProperties;
    displayArticleH2?: CSSProperties;
    displayStatNum?: CSSProperties;
    bodyLeadXl?: CSSProperties;
    bodyLead?: CSSProperties;
    bodyDefault?: CSSProperties;
    bodyTopicDesc?: CSSProperties;
    bodyTeaserStandard?: CSSProperties;
    bodyTeaserFeatured?: CSSProperties;
    bodyFooterDesc?: CSSProperties;
    bodyCallout?: CSSProperties;
    uiBtnPrimary?: CSSProperties;
    uiBtnAccent?: CSSProperties;
    uiBtnGhost?: CSSProperties;
    uiPillBtn?: CSSProperties;
    uiActionLink?: CSSProperties;
    uiNavLinkPrimary?: CSSProperties;
    uiNavLinkSecondary?: CSSProperties;
    uiTopbarLink?: CSSProperties;
    uiFooterLink?: CSSProperties;
    uiByLineName?: CSSProperties;
    uiInputDefault?: CSSProperties;
    uiInputXl?: CSSProperties;
    metaEyebrow?: CSSProperties;
    metaEyebrowSmall?: CSSProperties;
    metaLabel?: CSSProperties;
    metaChip?: CSSProperties;
    metaListIndex?: CSSProperties;
    metaInline?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayPageH1: true;
    displayMitmachenH1: true;
    displayTopicH1: true;
    displayArticleH1: true;
    displaySearchH1: true;
    displayFeaturedTeaser: true;
    displayFeatureH2: true;
    displaySection: true;
    displayMenuOverlay: true;
    displayNewsletter: true;
    displayLogo: true;
    displayLogoCompact: true;
    displayTopicCard: true;
    displayTeaserMd: true;
    displayTeaserLg: true;
    displayTeaserCompact: true;
    displayArticleH2: true;
    displayStatNum: true;
    bodyLeadXl: true;
    bodyLead: true;
    bodyDefault: true;
    bodyTopicDesc: true;
    bodyTeaserStandard: true;
    bodyTeaserFeatured: true;
    bodyFooterDesc: true;
    bodyCallout: true;
    uiBtnPrimary: true;
    uiBtnAccent: true;
    uiBtnGhost: true;
    uiPillBtn: true;
    uiActionLink: true;
    uiNavLinkPrimary: true;
    uiNavLinkSecondary: true;
    uiTopbarLink: true;
    uiFooterLink: true;
    uiByLineName: true;
    uiInputDefault: true;
    uiInputXl: true;
    metaEyebrow: true;
    metaEyebrowSmall: true;
    metaLabel: true;
    metaChip: true;
    metaListIndex: true;
    metaInline: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    'v2-btn-primary': true;
    'v2-btn-accent': true;
    'v2-btn-ghost': true;
    'v2-pillbtn': true;
  }
}
