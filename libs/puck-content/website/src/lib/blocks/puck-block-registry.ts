import { FullPuckBlockFragment, PuckBlockKind } from '@wepublish/website/api';
import { createContext, useContext } from 'react';

import { contentBlockRegistry } from '../components/content/content.registry';
import { dataBlockRegistry } from '../components/data/data.registry';
import { formBlockRegistry } from '../components/form/form.registry';
import { layoutBlockRegistry } from '../components/layout/layout.registry';
import { PuckBlockType } from './block-props';
import { PuckBlockDefinition, PuckBlockRegistry } from './block.types';

export const puckBlockRegistry = {
  ...layoutBlockRegistry,
  ...contentBlockRegistry,
  ...formBlockRegistry,
  ...dataBlockRegistry,
} satisfies Record<PuckBlockType, PuckBlockDefinition>;

export type PuckBlockComponents = Partial<PuckBlockRegistry>;

export const PuckBlockComponentsContext =
  createContext<PuckBlockComponents>(puckBlockRegistry);

export const usePuckBlockComponents = () =>
  useContext(PuckBlockComponentsContext);

export const isGeneratedPuckBlock = ({
  kind,
}: Pick<FullPuckBlockFragment, 'kind'>) => kind === PuckBlockKind.Generated;

export const puckBlockDefinition = (
  components: PuckBlockComponents,
  { kind, type }: Pick<FullPuckBlockFragment, 'kind' | 'type'>
): PuckBlockDefinition | undefined =>
  kind === PuckBlockKind.Puck && Object.hasOwn(components, type) ?
    components[type]
  : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const puckBlockProps = ({
  props,
}: Pick<FullPuckBlockFragment, 'props'>): Record<string, unknown> =>
  isRecord(props) ? props : {};
