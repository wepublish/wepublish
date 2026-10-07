import { EditorBlockType } from '@wepublish/editor/api';
import { ArticleMetadata, BlockValue } from '@wepublish/ui/editor';

export const InitialArticleBlocks: BlockValue[] = [
  {
    key: '0',
    type: EditorBlockType.Title,
    value: { preTitle: '', title: '', lead: '' },
  },
  {
    key: '1',
    type: EditorBlockType.Image,
    value: { image: null, caption: '' },
  },
];

export const emptyArticleMetadata: ArticleMetadata = {
  slug: '',
  preTitle: '',
  title: '',
  lead: '',
  seoTitle: '',
  seoDescription: '',
  authors: [],
  tags: [],
  defaultTags: [],
  url: '',
  properties: [],
  canonicalUrl: '',
  shared: undefined,
  paywall: undefined,
  hidden: false,
  disableComments: false,
  breaking: false,
  image: undefined,
  hideAuthor: false,
  socialMediaTitle: undefined,
  socialMediaDescription: undefined,
  socialMediaAuthors: [],
  socialMediaImage: undefined,
  likes: 0,
  trackingPixels: undefined,
};
