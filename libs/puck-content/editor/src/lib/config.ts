import { PuckDocumentKind } from '@wepublish/puck-content/website';

import { blockCatalog } from './block-library/block-library.catalog';
import { puckCategories } from './block-library/block-library.helpers';
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

const categories: PuckConfig['categories'] = puckCategories(blockCatalog);

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
