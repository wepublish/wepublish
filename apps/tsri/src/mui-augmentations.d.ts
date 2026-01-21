import { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    // Article
    articleAuthors: CSSProperties;
    // Teaser
    teaserTitle: CSSProperties;
    teaserPretitle: CSSProperties;
    teaserLead: CSSProperties;
    teaserMeta: CSSProperties;
    // Footer / Header
    categoryLinkTitle: CSSProperties;
    categoryLinkList: CSSProperties;
    categoryLinkItem: CSSProperties;
    // Footer
    footerSupportHeading: CSSProperties;
    footerSupportText: CSSProperties;
    footerSupportImprint: CSSProperties;
    // Banner
    bannerTitle: CSSProperties;
    bannerText: CSSProperties;
    bannerCta: CSSProperties;
    // Link -- MuiLink.variant is baed on Typography variants
    categoryLink: CSSProperties;
  }

  // Optional
  interface TypographyVariantsOptions {
    articleAuthors?: CSSProperties;
    teaserTitle?: CSSProperties;
    teaserPretitle?: CSSProperties;
    teaserLead?: CSSProperties;
    teaserMeta?: CSSProperties;
    categoryLinkTitle?: CSSProperties;
    categoryLinkList?: CSSProperties;
    categoryLinkItem?: CSSProperties;
    footerSupportHeading?: CSSProperties;
    footerSupportText?: CSSProperties;
    footerSupportImprint?: CSSProperties;
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
    teaserPretitle: true;
    teaserLead: true;
    teaserMeta: true;
    categoryLinkTitle: true;
    categoryLinkList: true;
    categoryLinkItem: true;
    footerSupportHeading: true;
    footerSupportText: true;
    footerSupportImprint: true;
    bannerTitle: true;
    bannerText: true;
    bannerCta: true;
    categoryLink: true;
  }
}

declare module '@mui/material/Link' {
  interface LinkPropsVariantOverrides {
    categoryLink: true;
  }
}
