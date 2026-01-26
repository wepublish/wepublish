import { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    // Article
    articleAuthors: CSSProperties;
    // Teaser
    teaserTitle: CSSProperties;
    teaserTitleLink: CSSProperties;
    teaserPretitleLink: CSSProperties;
    teaserPretitle: CSSProperties;
    teaserLead: CSSProperties;
    teaserMeta: CSSProperties;

    // Footer / Header
    categoryLinkTitle: CSSProperties;
    categoryLinkList: CSSProperties;
    categoryLinkItem: CSSProperties;

    // Banner
    bannerTitle: CSSProperties;
    bannerText: CSSProperties;
    bannerCta: CSSProperties;
    // Link -- MuiLink.variant is based on Typography variants
    categoryLink: CSSProperties;
    navbarTab: CSSProperties;
  }

  // Optional
  interface TypographyVariantsOptions {
    articleAuthors?: CSSProperties;
    teaserTitle?: CSSProperties;
    teaserTitleLink?: CSSProperties;
    teaserPretitleLink?: CSSProperties;
    teaserPretitle?: CSSProperties;
    teaserLead?: CSSProperties;
    teaserMeta?: CSSProperties;
    categoryLinkTitle?: CSSProperties;
    categoryLinkList?: CSSProperties;
    categoryLinkItem?: CSSProperties;
    bannerTitle?: CSSProperties;
    bannerText?: CSSProperties;
    bannerCta?: CSSProperties;
    categoryLink?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    articleAuthors: true;
    teaserTitle: true;
    teaserTitleLink: true;
    teaserPretitle: true;
    teaserPretitleLink: true;
    teaserLead: true;
    teaserMeta: true;
    categoryLinkTitle: true;
    categoryLinkList: true;
    categoryLinkItem: true;
    bannerTitle: true;
    bannerText: true;
    bannerCta: true;
    categoryLink: true;
    navbarTab: true;
  }
}

declare module '@mui/material/Link' {
  interface LinkPropsVariantOverrides {
    categoryLink: true;
    teaserTitleLink: true;
    teaserPretitleLink: true;
  }
}
