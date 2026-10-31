import { ComponentConfig } from '@puckeditor/core';
import {
  ArticleRootProps,
  PageRootProps,
} from '@wepublish/puck-content/editor';
import { createElement } from 'react';

import { FieldTabs } from './field-tabs.component';

export type FieldTabValue =
  | 'layout'
  | 'content'
  | 'style'
  | 'data'
  | 'visibility'
  | 'general'
  | 'byline'
  | 'publication'
  | 'seo'
  | 'socialMedia'
  | 'properties';

export type FieldTabsLayout = {
  order: FieldTabValue[];
  fallback: FieldTabValue;
  tabOf: Partial<Record<string, FieldTabValue>>;
};

export const componentFieldTabs: FieldTabsLayout = {
  order: ['layout', 'content', 'style', 'data', 'visibility'],
  fallback: 'content',
  tabOf: {
    layout: 'layout',
    styling: 'style',
    visibility: 'visibility',
    datasources: 'data',
  },
};

export const contentDatasourceFieldTabs: FieldTabsLayout = {
  ...componentFieldTabs,
  tabOf: { ...componentFieldTabs.tabOf, datasources: 'content' },
};

export const pageRootFieldTabs: FieldTabsLayout = {
  order: ['general', 'seo', 'socialMedia', 'properties'],
  fallback: 'general',
  tabOf: {
    seoTitle: 'seo',
    seoDescription: 'seo',
    socialMediaTitle: 'socialMedia',
    socialMediaDescription: 'socialMedia',
    socialMediaImageId: 'socialMedia',
    properties: 'properties',
  } satisfies Partial<Record<keyof PageRootProps, FieldTabValue>>,
};

export const articleRootFieldTabs: FieldTabsLayout = {
  order: [
    'general',
    'byline',
    'publication',
    'seo',
    'socialMedia',
    'properties',
  ],
  fallback: 'general',
  tabOf: {
    authorIds: 'byline',
    hideAuthor: 'byline',
    tags: 'publication',
    paywallId: 'publication',
    breaking: 'publication',
    hidden: 'publication',
    disableComments: 'publication',
    shared: 'publication',
    seoTitle: 'seo',
    seoDescription: 'seo',
    socialMediaTitle: 'socialMedia',
    socialMediaDescription: 'socialMedia',
    socialMediaImageId: 'socialMedia',
    socialMediaAuthorIds: 'socialMedia',
    properties: 'properties',
  } satisfies Partial<Record<keyof ArticleRootProps, FieldTabValue>>,
};

export const groupFieldTabs = (
  fieldNames: string[],
  { order, fallback, tabOf }: FieldTabsLayout = componentFieldTabs
) =>
  order
    .map(value => ({
      value,
      fields: fieldNames.filter(name => (tabOf[name] ?? fallback) === value),
    }))
    .filter(tab => tab.fields.length > 0);

export const withFieldTabs = <
  Config extends Pick<ComponentConfig<any>, 'renderFields'>,
>(
  config: Config,
  layout: FieldTabsLayout = componentFieldTabs
): Config => ({
  ...config,
  renderFields: ({ fields }) => createElement(FieldTabs, { fields, layout }),
});

export const withFieldTabsAll = <
  Components extends Record<string, ComponentConfig<any>>,
>(
  components: Components,
  layouts: Partial<Record<keyof Components, FieldTabsLayout>> = {}
): Components =>
  Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      withFieldTabs(component, layouts[name]),
    ])
  ) as Components;
