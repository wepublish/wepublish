import {
  FullPuckBlockFragment,
  PuckBlockInput,
  PuckRegistryInput,
} from '@wepublish/editor/api';
import { PuckDocumentKind } from '@wepublish/puck-content/website';
import { z } from 'zod/v4';

import { PuckContent, PuckData, PuckRootPropsByKind } from '../config.types';
import {
  articleRootSchema,
  pageRootSchema,
  rootPropertySchema,
} from '../root/root.field';
import {
  DerivedDatasources,
  fromPuckBlocks,
  PuckSlotConfig,
  toPuckBlockInputs,
} from './puck-blocks';
import {
  dynamicConfigOf,
  PuckDynamicConfig,
  readDynamicConfig,
  StoredPuckRegistry,
  toDynamicConfig,
  toPuckRegistryInput,
  withoutDynamicConfig,
} from './puck-registry';

export type PuckDocument<K extends PuckDocumentKind = PuckDocumentKind> = {
  puckBlocks: PuckBlockInput[];
  puckRegistry: PuckRegistryInput | null;
  rootProps: PuckRootPropsByKind[K];
};

export type LoadedPuckDocument<K extends PuckDocumentKind> =
  | { data: PuckData<K>; error?: undefined }
  | { data?: undefined; error: unknown };

const withoutEmptyValues = (value: unknown) =>
  value && typeof value === 'object' ?
    Object.fromEntries(
      Object.entries(value).filter(
        ([, entry]) => entry !== null && entry !== ''
      )
    )
  : value;

const storedRootShape = {
  slug: z.string(),
  properties: z.array(rootPropertySchema.extend({ key: z.string() })),
};

const storedPageRootSchema = pageRootSchema.extend(storedRootShape).partial();

const storedArticleRootSchema = articleRootSchema
  .extend(storedRootShape)
  .partial();

const rootPropsParsers: {
  [K in PuckDocumentKind]: (metadata: unknown) => PuckRootPropsByKind[K];
} = {
  page: metadata => storedPageRootSchema.parse(metadata),
  article: metadata => storedArticleRootSchema.parse(metadata),
};

export const toPuckRootProps = <K extends PuckDocumentKind>(
  kind: K,
  metadata: unknown = {}
): PuckRootPropsByKind[K] =>
  rootPropsParsers[kind](withoutEmptyValues(metadata));

const withRegistry = <Props extends object>(
  props: Props,
  dynamicConfig: PuckDynamicConfig | undefined
): Props => ({
  ...props,
  ...(dynamicConfig && { _dynamicConfig: dynamicConfig }),
});

const puckDataOf: {
  [K in PuckDocumentKind]: (
    content: PuckContent,
    rootProps: PuckRootPropsByKind[K],
    dynamicConfig: PuckDynamicConfig | undefined
  ) => PuckData<K>;
} = {
  page: (content, rootProps, dynamicConfig) => ({
    root: { props: withRegistry(rootProps, dynamicConfig) },
    content,
  }),
  article: (content, rootProps, dynamicConfig) => ({
    root: { props: withRegistry(rootProps, dynamicConfig) },
    content,
  }),
};

export const fromPuckDocument = <K extends PuckDocumentKind>(
  kind: K,
  puckBlocks: readonly FullPuckBlockFragment[] | null | undefined,
  puckRegistry: StoredPuckRegistry | null | undefined,
  rootProps: unknown,
  derivedDatasources?: DerivedDatasources
): LoadedPuckDocument<K> => {
  try {
    const loaded = fromPuckBlocks(puckBlocks ?? [], { derivedDatasources });

    if (loaded.error) {
      return { error: loaded.error };
    }

    return {
      data: puckDataOf[kind](
        loaded.content as PuckContent,
        toPuckRootProps(kind, rootProps),
        toDynamicConfig(puckRegistry)
      ),
    };
  } catch (error) {
    return { error };
  }
};

const rootPropsOf: {
  [K in PuckDocumentKind]: (data: PuckData<K>) => PuckRootPropsByKind[K];
} = {
  page: ({ root }) => root.props ?? {},
  article: ({ root }) => root.props ?? {},
};

export const toPuckDocument = <K extends PuckDocumentKind>(
  kind: K,
  data: PuckData<K>,
  config: PuckSlotConfig,
  derivedDatasources?: DerivedDatasources
): PuckDocument<K> => {
  const rootProps = rootPropsOf[kind](data);
  const dynamicConfig = dynamicConfigOf(rootProps);

  return {
    puckBlocks: toPuckBlockInputs(data.content, {
      config,
      dynamicConfig: readDynamicConfig(dynamicConfig),
      derivedDatasources,
    }),
    puckRegistry: toPuckRegistryInput(dynamicConfig),
    rootProps: withoutDynamicConfig(rootProps),
  };
};
