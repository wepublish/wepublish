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

    // Teaser Sidebar Daily Briefing
    dailyBriefingLinkList: CSSProperties;
    dailyBriefingLinkItem: CSSProperties;
    dailyBriefingLink: CSSProperties;

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
    dailyBriefingLinkList?: CSSProperties;
    dailyBriefingLinkItem?: CSSProperties;
    dailyBriefingLink?: CSSProperties;
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
    navbarTab?: CSSProperties;
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
    dailyBriefingLinkList: true;
    dailyBriefingLinkItem: true;
    dailyBriefingLink: true;
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
    navbarTab: true;
  }
}

declare module '@mui/material/Link' {
  interface LinkPropsVariantOverrides {
    categoryLink: true;
    navbarTab: true;
    dailyBriefingLink: true;
    teaserTitleLink: true;
    teaserPretitleLink: true;
  }
}

declare module '@mui/material/Toolbar' {
  interface ToolbarPropsVariantOverrides {
    navbarInnerWrapper: true;
  }
}
