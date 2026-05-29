import { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    articleAuthors: CSSProperties;
    teaserTitle: CSSProperties;
    teaserTitleLink: CSSProperties;
    teaserPretitleLink: CSSProperties;
    teaserPretitle: CSSProperties;
    teaserLead: CSSProperties;
    teaserMeta: CSSProperties;
    teaserSlotsTitle: CSSProperties;
    categoryLinkTitle: CSSProperties;
    categoryLinkList: CSSProperties;
    categoryLinkItem: CSSProperties;
    categoryAddress: CSSProperties;
    categoryAddressText: CSSProperties;
    footerLink: CSSProperties;
    buttonLinkMain: CSSProperties;
    buttonLinkSecondary: CSSProperties;
    bannerTitle: CSSProperties;
    bannerText: CSSProperties;
    bannerCta: CSSProperties;
    categoryLink: CSSProperties;
    headerCategoryLink: CSSProperties;
    navbarTab: CSSProperties;
    tocHeading: CSSProperties;
    tocDetails: CSSProperties;
    ulToc: CSSProperties;
    liToc: CSSProperties;
    linkToc: CSSProperties;
    ulDownloads: CSSProperties;
    liDownloads: CSSProperties;
    linkDownloads: CSSProperties;
    authorListItemName: CSSProperties;
    authorListItemJobTitle: CSSProperties;
    authorListItemBio: CSSProperties;
    authorListItemLink: CSSProperties;
    linkAuthorListItemBio: CSSProperties;
  }

  interface TypographyVariantsOptions {
    articleAuthors?: CSSProperties;
    teaserTitle?: CSSProperties;
    teaserTitleLink?: CSSProperties;
    teaserPretitleLink?: CSSProperties;
    teaserPretitle?: CSSProperties;
    teaserLead?: CSSProperties;
    teaserMeta?: CSSProperties;
    teaserSlotsTitle?: CSSProperties;
    categoryLinkTitle?: CSSProperties;
    categoryLinkList?: CSSProperties;
    categoryLinkItem?: CSSProperties;
    categoryAddress?: CSSProperties;
    categoryAddressText?: CSSProperties;
    footerLink?: CSSProperties;
    buttonLinkMain?: CSSProperties;
    buttonLinkSecondary?: CSSProperties;
    bannerTitle?: CSSProperties;
    bannerText?: CSSProperties;
    bannerCta?: CSSProperties;
    categoryLink?: CSSProperties;
    headerCategoryLink?: CSSProperties;
    tocHeading?: CSSProperties;
    tocDetails?: CSSProperties;
    ulToc?: CSSProperties;
    liToc?: CSSProperties;
    linkToc?: CSSProperties;
    ulDownloads?: CSSProperties;
    liDownloads?: CSSProperties;
    linkDownloads?: CSSProperties;
    authorListItemName?: CSSProperties;
    authorListItemJobTitle?: CSSProperties;
    authorListItemBio?: CSSProperties;
    authorListItemLink?: CSSProperties;
    linkAuthorListItemBio?: CSSProperties;
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
    teaserSlotsTitle: true;
    categoryLinkTitle: true;
    categoryLinkList: true;
    categoryLinkItem: true;
    categoryAddress: true;
    categoryAddressText: true;
    footerLink: true;
    buttonLinkMain: true;
    buttonLinkSecondary: true;
    bannerTitle: true;
    bannerText: true;
    bannerCta: true;
    categoryLink: true;
    headerCategoryLink: true;
    navbarTab: true;
    tocHeading: true;
    tocDetails: true;
    ulToc: true;
    liToc: true;
    linkToc: true;
    ulDownloads: true;
    liDownloads: true;
    linkDownloads: true;
    authorListItemName: true;
    authorListItemJobTitle: true;
    authorListItemBio: true;
    authorListItemLink: true;
    linkAuthorListItemBio: true;
  }
}

declare module '@mui/material/Link' {
  interface LinkPropsVariantOverrides {
    categoryLink: true;
    headerCategoryLink: true;
    teaserTitleLink: true;
    teaserPretitleLink: true;
    buttonLinkMain: true;
    buttonLinkSecondary: true;
    linkToc: true;
    linkDownloads: true;
    authorListItemLink: true;
    linkAuthorListItemBio: true;
  }
}
