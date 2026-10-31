import { Config, Data } from '@puckeditor/core';
import {
  ArticleRootProps,
  PageRootProps,
  UserFields,
} from '@wepublish/puck-content/editor';

import { Components } from '../types';

export type PuckRootPropsByKind = {
  page: PageRootProps;
  article: ArticleRootProps;
};

export type PuckDocumentKind = keyof PuckRootPropsByKind;

export const puckDocumentKinds = [
  'page',
  'article',
] as const satisfies readonly PuckDocumentKind[];

export type PuckCategories = [
  'recommended',
  'content',
  'layout',
  'form',
  'data',
  'embed',
  'teaser',
];

export type PuckConfig<K extends PuckDocumentKind = PuckDocumentKind> = Config<{
  components: Components;
  fields: UserFields;
  root: PuckRootPropsByKind[K];
  categories: PuckCategories;
}>;

export type PuckData<K extends PuckDocumentKind = PuckDocumentKind> = Data<
  Components,
  PuckRootPropsByKind[K]
>;

export type PuckContent = PuckData['content'];

export type PuckRootConfig<K extends PuckDocumentKind> = NonNullable<
  PuckConfig<K>['root']
>;

export type PuckRootRender<K extends PuckDocumentKind> = NonNullable<
  PuckRootConfig<K>['render']
>;
