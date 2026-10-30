import { ComponentConfig } from '@puckeditor/core';
import { createElement } from 'react';

import { FieldTabs } from './field-tabs.component';

export type FieldTabValue =
  | 'layout'
  | 'content'
  | 'style'
  | 'data'
  | 'visibility'
  | 'general'
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
    css: 'style',
    visibility: 'visibility',
    datasources: 'data',
  },
};

export const contentDatasourceFieldTabs: FieldTabsLayout = {
  ...componentFieldTabs,
  tabOf: { ...componentFieldTabs.tabOf, datasources: 'content' },
};

export const rootFieldTabs: FieldTabsLayout = {
  order: ['general', 'seo', 'socialMedia', 'properties'],
  fallback: 'general',
  tabOf: {
    seoTitle: 'seo',
    seoDescription: 'seo',
    socialMediaTitle: 'socialMedia',
    socialMediaDescription: 'socialMedia',
    socialMediaImageId: 'socialMedia',
    properties: 'properties',
  },
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
