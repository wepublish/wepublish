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
  useContext,
  useMemo,
} from 'react';

import { PuckBlockNode } from '../blocks/block-tree';
import {
  GeneratedRegistry,
  hasGeneratedComponent,
  toGeneratedRegistry,
} from './generated-registry';

type GeneratedBlockNode = PuckBlockNode<FullPuckBlockFragment>;

const PuckGeneratedBlock = lazy(() =>
  import('./generated-block.component').then(module => ({
    default: module.PuckGeneratedBlock,
  }))
);

const PuckGeneratedGlobals = lazy(() =>
  import('./generated-block.component').then(module => ({
    default: module.PuckGeneratedGlobals,
  }))
);

const GeneratedBlocksContext = createContext<GeneratedRegistry | null>(null);

const GeneratedGlobals = ({ registry }: { registry: GeneratedRegistry }) =>
  (registry.styles || registry.script) && (
    <HideOnError key={registry.hash}>
      <Suspense fallback={null}>
        <PuckGeneratedGlobals registry={registry} />
      </Suspense>
    </HideOnError>
  );

export type GeneratedBlocksProviderProps = {
  registry?: FullPuckRegistryFragment | null;
  children?: ReactNode;
};

export const GeneratedBlocksProvider = ({
  registry,
  children,
}: GeneratedBlocksProviderProps) => {
  const generated = useMemo(
    () => (registry ? toGeneratedRegistry(registry) : null),
    [registry]
  );

  return (
    <GeneratedBlocksContext.Provider value={generated}>
      {generated && <GeneratedGlobals registry={generated} />}
      {children}
    </GeneratedBlocksContext.Provider>
  );
};

export type GeneratedBlockProps = {
  node: GeneratedBlockNode;
  className?: string;
  ChildBlock: ComponentType<{ node: GeneratedBlockNode }>;
};

export const GeneratedBlock = (props: GeneratedBlockProps) => {
  const registry = useContext(GeneratedBlocksContext);

  if (!registry || !hasGeneratedComponent(registry, props.node.block.type)) {
    return null;
  }

  return (
    <HideOnError key={registry.hash}>
      <Suspense fallback={null}>
        <PuckGeneratedBlock
          {...props}
          registry={registry}
        />
      </Suspense>
    </HideOnError>
  );
};
