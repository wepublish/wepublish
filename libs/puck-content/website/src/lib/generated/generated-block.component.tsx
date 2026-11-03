import type { ComponentData, Config, Data } from '@puckeditor/core';
import { Render } from '@puckeditor/core/rsc';
import { withDynamicConfig } from '@puckeditor/plugin-ai';
import { FullPuckBlockFragment } from '@wepublish/website/api';
import { ComponentType, createContext, use, useContext, useMemo } from 'react';

import { PuckBlockNode } from '../blocks/block-tree';
import { puckBlockProps } from '../blocks/puck-block-registry';
import { createBoundedCache } from './bounded-cache';
import {
  generatedDynamicConfig,
  GeneratedRegistry,
} from './generated-registry';

type GeneratedBlockNode = PuckBlockNode<FullPuckBlockFragment>;

type ChildBlockComponent = ComponentType<{ node: GeneratedBlockNode }>;

type GeneratedChildren = {
  nodes: ReadonlyMap<string, GeneratedBlockNode>;
  ChildBlock: ChildBlockComponent;
};

const GeneratedChildrenContext = createContext<GeneratedChildren | null>(null);

const GeneratedChild = ({ id }: { id: string }) => {
  const children = useContext(GeneratedChildrenContext);
  const node = children?.nodes.get(id);

  return children && node ? <children.ChildBlock node={node} /> : null;
};

const childBlockType = 'wepublish:block';

const childBlockConfig: Config = {
  components: {
    [childBlockType]: { render: ({ id }) => <GeneratedChild id={id} /> },
  },
};

const puckData = (
  rootProps: Record<string, unknown>,
  content: ComponentData[] = []
): Data => ({ root: { props: rootProps }, content });

const renderedOnServer = typeof window === 'undefined';

const generatedConfigs = createBoundedCache<string, Config>(32);

const appliedConfigs = createBoundedCache<string, Promise<Config>>(32);

const scheduledConfigs = createBoundedCache<string, Promise<Config>>(32);

const appliedRegistries = new Map<string, string>();

let appliedCount = 0;

const holdsRegistry = ({ hash, components }: GeneratedRegistry) =>
  Object.keys(components).every(type => appliedRegistries.get(type) === hash);

const applyGeneratedRegistry = (registry: GeneratedRegistry) => {
  const types = Object.keys(registry.components);

  types.forEach(type => appliedRegistries.delete(type));

  const config = withDynamicConfig(
    childBlockConfig,
    puckData({ _dynamicConfig: generatedDynamicConfig(registry) })
  );

  types.forEach(type => appliedRegistries.set(type, registry.hash));
  appliedCount += 1;

  return generatedConfigs.get(registry.hash, () => config);
};

const configOnServer = (registry: GeneratedRegistry) =>
  (holdsRegistry(registry) && generatedConfigs.peek(registry.hash)) ||
  applyGeneratedRegistry(registry);

const applyAfterRender = (registry: GeneratedRegistry) => {
  const applied: Promise<Config> = Promise.resolve().then(() => {
    const config = applyGeneratedRegistry(registry);

    appliedConfigs.get(registry.hash, () => applied);

    return config;
  });

  return applied;
};

const configAfterRender = (registry: GeneratedRegistry) =>
  (holdsRegistry(registry) && appliedConfigs.peek(registry.hash)) ||
  scheduledConfigs.get(`${appliedCount}:${registry.hash}`, () =>
    applyAfterRender(registry)
  );

const useGeneratedConfig = (registry: GeneratedRegistry) =>
  renderedOnServer ?
    configOnServer(registry)
  : use(configAfterRender(registry));

const globalsConfig = withDynamicConfig(childBlockConfig, puckData({}));

const settledConfigs = new WeakMap<Promise<Config>, Promise<void>>();

const settled = (config: Promise<Config>) => {
  const known = settledConfigs.get(config);

  if (known) {
    return known;
  }

  const settling = config.then(
    () => undefined,
    () => undefined
  );

  settledConfigs.set(config, settling);

  return settling;
};

const useAfterGeneratedConfig = (registry: GeneratedRegistry) => {
  if (!renderedOnServer) {
    use(settled(configAfterRender(registry)));
  }
};

const toPuckItem = ({ block, slots }: GeneratedBlockNode): ComponentData => ({
  type: block.type,
  props: {
    ...puckBlockProps(block),
    ...Object.fromEntries(
      [...slots].map(([slot, children]) => [
        slot,
        children.map(child => ({
          type: childBlockType,
          props: { id: child.block.id },
        })),
      ])
    ),
    id: block.id,
  },
});

export type PuckGeneratedBlockProps = {
  registry: GeneratedRegistry;
  node: GeneratedBlockNode;
  className?: string;
  ChildBlock: ChildBlockComponent;
};

export const PuckGeneratedBlock = ({
  registry,
  node,
  className,
  ChildBlock,
}: PuckGeneratedBlockProps) => {
  const config = useGeneratedConfig(registry);
  const data = useMemo(() => puckData({}, [toPuckItem(node)]), [node]);
  const children = useMemo(
    () => ({
      nodes: new Map(
        [...node.slots.values()]
          .flat()
          .map((child): [string, GeneratedBlockNode] => [child.block.id, child])
      ),
      ChildBlock,
    }),
    [node, ChildBlock]
  );

  return (
    <GeneratedChildrenContext.Provider value={children}>
      <div className={className}>
        <Render
          config={config}
          data={data}
        />
      </div>
    </GeneratedChildrenContext.Provider>
  );
};

export const PuckGeneratedGlobals = ({
  registry,
}: {
  registry: GeneratedRegistry;
}) => {
  useAfterGeneratedConfig(registry);

  const data = useMemo(
    () =>
      puckData({
        _dynamicConfig: { styles: registry.styles, script: registry.script },
      }),
    [registry]
  );

  return (
    <Render
      config={globalsConfig}
      data={data}
    />
  );
};
