import { PuckBlockDefinition } from '../../blocks/block.types';
import {
  CollapsibleConfigProps,
  CollapsibleRender,
} from './collapsible/collapsible.component';
import {
  ContainerProps,
  ContainerRender,
} from './container/container.component';
import {
  DynamicGridProps,
  DynamicGridRender,
} from './dynamic-grid/dynamic-grid.component';
import { GridProps, GridRender } from './grid/grid.component';
import { LinkedTemplateProps } from './linked-template/linked-template';
import { LinkedTemplateRender } from './linked-template/linked-template.component';
import { RowProps, RowRender } from './row/row.component';
import { SliderProps, SliderRender } from './slider/slider.component';
import { SpaceProps, SpaceRender } from './space/space.component';

export type LayoutBlockProps = {
  Space: SpaceProps;
  Grid: GridProps;
  DynamicGrid: DynamicGridProps;
  Row: RowProps;
  Slider: SliderProps;
  Container: ContainerProps;
  Collapsible: CollapsibleConfigProps;
  LinkedTemplate: LinkedTemplateProps;
};

export const layoutBlockRegistry: {
  [Type in keyof LayoutBlockProps]: PuckBlockDefinition<LayoutBlockProps[Type]>;
} = {
  Space: { component: SpaceRender },
  Grid: { component: GridRender },
  DynamicGrid: { component: DynamicGridRender },
  Row: { component: RowRender },
  Slider: { component: SliderRender },
  Container: { component: ContainerRender, marginSides: ['top', 'bottom'] },
  Collapsible: { component: CollapsibleRender },
  LinkedTemplate: {
    component:
      LinkedTemplateRender as PuckBlockDefinition<LinkedTemplateProps>['component'],
  },
};

export * from './collapsible/collapsible.component';
export * from './container/container.component';
export * from './dynamic-grid/dynamic-grid.component';
export * from './gap';
export * from './grid-placement';
export * from './grid/grid.component';
export * from './linked-template/linked-template';
export * from './linked-template/linked-template.component';
export * from './items-alignment';
export * from './row/row.component';
export * from './slider/slider.component';
export * from './space/space.component';
