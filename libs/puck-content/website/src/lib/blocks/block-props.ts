import {
  ContentBlockProps,
  contentBlockRegistry,
} from '../components/content/content.registry';
import {
  DataBlockProps,
  dataBlockRegistry,
} from '../components/data/data.registry';
import {
  FormBlockProps,
  formBlockRegistry,
} from '../components/form/form.registry';
import {
  LayoutBlockProps,
  layoutBlockRegistry,
} from '../components/layout/layout.registry';

export type PuckBlockPropsByType = LayoutBlockProps &
  ContentBlockProps &
  FormBlockProps &
  DataBlockProps;

export type PuckBlockType = keyof PuckBlockPropsByType;

const registeredTypes = {
  ...layoutBlockRegistry,
  ...contentBlockRegistry,
  ...formBlockRegistry,
  ...dataBlockRegistry,
} satisfies Record<PuckBlockType, unknown>;

export const puckBlockTypes = Object.keys(registeredTypes) as PuckBlockType[];
