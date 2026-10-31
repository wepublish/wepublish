import { HideOnError } from '@wepublish/errors/website';
import {
  FullPuckBlockFragment,
  FullPuckRegistryFragment,
} from '@wepublish/website/api';
import {
  ComponentType,
  createContext,
  lazy,
  ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import { PuckBlockNode } from '../blocks/block-tree';
import { createGeneratedMounts, GeneratedMounts } from './generated-mounts';
import {
  GeneratedRegistry,
  hasGeneratedComponent,
  toGeneratedRegistry,
} from './generated-registry';
import { useGeneratedScript } from './generated-script';

type GeneratedBlockNode = PuckBlockNode<FullPuckBlockFragment>;

type GeneratedBlocks = {
  registry: GeneratedRegistry;
  mounts: GeneratedMounts;
};

const PuckGeneratedBlock = lazy(() =>
  import('./generated-block.component').then(module => ({
    default: module.PuckGeneratedBlock,
  }))
);

const GeneratedBlocksContext = createContext<GeneratedBlocks | null>(null);

const GeneratedGlobals = ({ registry, mounts }: GeneratedBlocks) => {
  const [mountedHash, setMountedHash] = useState<string | null>(null);

  useEffect(
    () => mounts.whenMounted(() => setMountedHash(registry.hash)),
    [mounts, registry.hash]
  );
  useGeneratedScript(
    registry.hash,
    mountedHash === registry.hash ? registry.script : null
  );

  return registry.styles ? <style>{registry.styles}</style> : null;
};

export type GeneratedBlocksProviderProps = {
  registry?: FullPuckRegistryFragment | null;
  children?: ReactNode;
};

export const GeneratedBlocksProvider = ({
  registry,
  children,
}: GeneratedBlocksProviderProps) => {
  const [mounts] = useState(createGeneratedMounts);
  const generated = useMemo(
    () =>
      registry ? { registry: toGeneratedRegistry(registry), mounts } : null,
    [registry, mounts]
  );

  return (
    <GeneratedBlocksContext.Provider value={generated}>
      {generated && <GeneratedGlobals {...generated} />}
      {children}
    </GeneratedBlocksContext.Provider>
  );
};

const GeneratedBlockMounted = ({
  mounts,
  id,
}: {
  mounts: GeneratedMounts;
  id: string;
}) => {
  useEffect(() => mounts.mounted(id), [mounts, id]);

  return null;
};

export type GeneratedBlockProps = {
  node: GeneratedBlockNode;
  className?: string;
  ChildBlock: ComponentType<{ node: GeneratedBlockNode }>;
};

const MountedGeneratedBlock = ({
  generated: { registry, mounts },
  node,
  className,
  ChildBlock,
}: GeneratedBlockProps & { generated: GeneratedBlocks }) => {
  const { id } = node.block;
  const failed = useCallback(() => mounts.mounted(id), [mounts, id]);

  useLayoutEffect(() => mounts.wait(id), [mounts, id, registry.hash]);

  return (
    <HideOnError
      key={registry.hash}
      onError={failed}
    >
      <Suspense fallback={null}>
        <PuckGeneratedBlock
          registry={registry}
          node={node}
          className={className}
          ChildBlock={ChildBlock}
        />
        <GeneratedBlockMounted
          mounts={mounts}
          id={id}
        />
      </Suspense>
    </HideOnError>
  );
};

export const GeneratedBlock = (props: GeneratedBlockProps) => {
  const generated = useContext(GeneratedBlocksContext);

  if (
    !generated ||
    !hasGeneratedComponent(generated.registry, props.node.block.type)
  ) {
    return null;
  }

  return (
    <MountedGeneratedBlock
      {...props}
      generated={generated}
    />
  );
};
