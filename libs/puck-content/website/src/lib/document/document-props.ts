export const puckDocumentKinds = ['page', 'article'] as const;

export type PuckDocumentKind = (typeof puckDocumentKinds)[number];

export type RootProperty = { key: string; value: string; public: boolean };

export type DocumentRootProps = {
  title?: string;
  lead?: string;
  imageId?: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  socialMediaTitle?: string;
  socialMediaDescription?: string;
  socialMediaImageId?: string;
  properties?: RootProperty[];
  hidden?: boolean;
  tags?: string[];
};

export type PageRootProps = DocumentRootProps & {
  showNavigation?: boolean;
  showFooter?: boolean;
};

export type ArticleRootProps = DocumentRootProps & {
  preTitle?: string;
  canonicalUrl?: string;
  authorIds?: string[];
  hideAuthor?: boolean;
  paywallId?: string;
  breaking?: boolean;
  disableComments?: boolean;
  shared?: boolean;
};
