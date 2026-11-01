import { PuckDocumentKind } from '@wepublish/puck-content/website';

import { withLockAll } from './blocks/with-lock';
import {
  contentComponents,
  contentDerivedDatasources,
  contentFieldTabs,
} from './components/content/content.blocks';
import {
  dataBlockConsumes,
  dataComponents,
} from './components/data/data.blocks';
import { formComponents } from './components/form/form.blocks';
import { formComponentNames } from './components/form/form-components';
import {
  layoutComponents,
  layoutFieldTabs,
} from './components/layout/layout.blocks';
import {
  PuckBlockConsumes,
  PuckConfig,
  PuckDerivedDatasources,
} from './config.types';
import { withFieldTabsAll } from './field-tabs/field-tabs';
import { ArticleRootConfig } from './root/article-root.config';
import { PageRootConfig } from './root/page-root.config';

const components: PuckConfig['components'] = withLockAll(
  withFieldTabsAll(
    {
      ...layoutComponents,
      ...contentComponents,
      ...formComponents,
      ...dataComponents,
    },
    { ...layoutFieldTabs, ...contentFieldTabs }
  )
);

const categories: PuckConfig['categories'] = {
  recommended: {
    components: ['Title', 'RichText', 'Subscribe'],
  },
  content: {
    components: [
      'Title',
      'Quote',
      'RichText',
      'Image',
      'Lightbox',
      'Listicle',
      'Button',
      'Break',
    ],
    defaultExpanded: false,
  },
  layout: {
    components: [
      'Space',
      'Grid',
      'DynamicGrid',
      'Row',
      'Slider',
      'Container',
      'Collapsible',
    ],
    defaultExpanded: false,
  },
  form: {
    title: 'Form',
    components: [...formComponentNames],
    defaultExpanded: false,
  },
  data: {
    title: 'Data',
    components: [
      'Subscribe',
      'MailchimpForm',
      'Poll',
      'Comment',
      'Event',
      'Crowdfunding',
    ],
    defaultExpanded: false,
  },
  embed: {
    components: [
      'IFrame',
      'YouTube',
      'FacebookVideo',
      'Facebook',
      'Instagram',
      'TikTok',
      'Vimeo',
      'Twitter',
      'SoundCloud',
      'Streamable',
      'Polis',
      'BildwurfAd',
      'Html',
    ],
    defaultExpanded: false,
  },
  teaser: {
    title: 'Teaser',
    components: [
      'Teaser',
      'TeaserTitle',
      'TeaserPreTitle',
      'TeaserLead',
      'TeaserImage',
      'TeaserAuthors',
      'TeaserDate',
      'TeaserTags',
    ],
    defaultExpanded: false,
  },
  other: {
    defaultExpanded: false,
  },
};

export const puckConfigs: { [K in PuckDocumentKind]: PuckConfig<K> } = {
  page: { root: PageRootConfig, components, categories },
  article: { root: ArticleRootConfig, components, categories },
};

export const getPuckConfig = <K extends PuckDocumentKind>(
  kind: K
): PuckConfig<K> => puckConfigs[kind];

export const config = puckConfigs.page;

export const puckDerivedDatasources: PuckDerivedDatasources = {
  ...contentDerivedDatasources,
};

export const puckBlockConsumes: PuckBlockConsumes = {
  ...dataBlockConsumes,
};
