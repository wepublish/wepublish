import type { FullPuckBlockDataFragment } from '@wepublish/website/api';
import type { CSSProperties, ElementType, ReactNode, Ref } from 'react';

import { Side } from '../values/sides';
import { BlockVisibility, PuckStyling } from './graphql-shape';

export type PuckSlotValue = [];

export type PuckSlotProps = {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

export type PuckSlotComponent = (props?: PuckSlotProps) => ReactNode;

export type PuckSlots = Readonly<Record<string, PuckSlotComponent | undefined>>;

export type PuckBlockData = Omit<FullPuckBlockDataFragment, '__typename'>;

export const emptyPuckBlockData: PuckBlockData = {
  articles: null,
  pages: null,
  events: null,
  images: null,
  memberPlans: null,
  userSubscriptions: null,
};

export type PuckBlockRenderProps<
  Props,
  Extra = object,
  Data = PuckBlockData,
> = {
  id: string;
  props: Props;
  data: Data;
  slots: PuckSlots;
  styling?: PuckStyling | null;
  visibility?: BlockVisibility | null;
  className?: string;
  ref?: Ref<HTMLElement>;
} & Partial<Extra>;

export type PuckBlockComponent<Props, Extra = object, Data = PuckBlockData> = (
  props: PuckBlockRenderProps<Props, Extra, Data>
) => ReactNode;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PuckBlockDefinition<Props = any, Extra = any> = {
  component: PuckBlockComponent<Props, Extra>;
  marginSides?: readonly Side[];
};

export type PuckBlockRegistry = Record<string, PuckBlockDefinition>;
