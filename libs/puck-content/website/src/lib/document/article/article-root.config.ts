import {
  articleRootSchema,
  ArticleRootProps,
  articleTagSelectField,
  rootFieldAi,
} from '@wepublish/puck-content/editor';

import {
  articleRootFieldTabs,
  withFieldTabs,
} from '../../field-tabs/field-tabs';
import { PuckRootConfig } from '../document';
import {
  rootGeneralFields,
  rootPropertiesFields,
  rootSeoFields,
  rootSocialMediaFields,
} from '../root-fields';
import { ArticleRoot } from './article-root.component';

const ai = (key: keyof ArticleRootProps) => rootFieldAi(articleRootSchema, key);

export const ArticleRootConfig = withFieldTabs<PuckRootConfig<'article'>>(
  {
    label: 'Article',
    fields: {
      preTitle: { type: 'text', label: 'Pre-title', ai: ai('preTitle') },
      ...rootGeneralFields(ai),
      canonicalUrl: {
        type: 'text',
        label: 'Canonical URL',
        ai: ai('canonicalUrl'),
      },
      authorIds: {
        type: 'record',
        model: 'author',
        multiple: true,
        label: 'Authors',
        ai: ai('authorIds'),
      },
      hideAuthor: {
        type: 'switch',
        label: 'Hide author',
        ai: ai('hideAuthor'),
      },
      tags: { ...articleTagSelectField('Tags'), ai: ai('tags') },
      paywallId: {
        type: 'record',
        model: 'paywall',
        label: 'Paywall',
        ai: ai('paywallId'),
      },
      breaking: { type: 'switch', label: 'Breaking news', ai: ai('breaking') },
      hidden: { type: 'switch', label: 'Hidden', ai: ai('hidden') },
      disableComments: {
        type: 'switch',
        label: 'Disable comments',
        ai: ai('disableComments'),
      },
      shared: { type: 'switch', label: 'Share with peers', ai: ai('shared') },
      ...rootSeoFields(ai),
      ...rootSocialMediaFields(ai),
      socialMediaAuthorIds: {
        type: 'record',
        model: 'author',
        multiple: true,
        label: 'Social media authors',
        ai: ai('socialMediaAuthorIds'),
      },
      ...rootPropertiesFields(ai),
    },
    render: ArticleRoot,
  },
  articleRootFieldTabs
);
