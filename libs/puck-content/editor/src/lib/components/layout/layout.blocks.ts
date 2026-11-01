import { withCSS } from '../../blocks/with-css';
import {
  DatasourceSettings,
  withDataSource,
} from '../../blocks/with-datasource';
import { withVisibility } from '../../blocks/with-visibility';
import {
  FieldTabsLayout,
  layoutItemsFieldTabs,
} from '../../field-tabs/field-tabs';
import { CollapsibleConfig } from './collapsible/collapsible.config';
import { ContainerConfig } from './container/container.config';
import { DynamicGrid } from './dynamic-grid/dynamic-grid.config';
import { Grid } from './grid/grid.config';
import { Row } from './row/row.config';
import { Slider } from './slider/slider.config';
import { Space } from './space/space.config';

const layoutDatasource: DatasourceSettings = {
  models: ['article', 'page', 'event'],
  types: ['uniqueList', 'list', 'multiple', 'single', 'slot'],
};

export const layoutComponents = {
  Space: withVisibility(withCSS(Space)),
  Grid: withVisibility(
    withDataSource(withCSS(Grid), undefined, layoutDatasource)
  ),
  DynamicGrid: withVisibility(
    withDataSource(withCSS(DynamicGrid), undefined, layoutDatasource)
  ),
  Row: withVisibility(
    withDataSource(withCSS(Row), undefined, layoutDatasource)
  ),
  Slider: withVisibility(
    withDataSource(withCSS(Slider), undefined, layoutDatasource)
  ),
  Container: withVisibility(
    withDataSource(
      withCSS(ContainerConfig, { marginSides: ['top', 'bottom'] }),
      undefined,
      layoutDatasource
    )
  ),
  Collapsible: withVisibility(withCSS(CollapsibleConfig)),
};

export const layoutFieldTabs: Partial<
  Record<keyof typeof layoutComponents, FieldTabsLayout>
> = {
  DynamicGrid: layoutItemsFieldTabs,
};

export * from './collapsible/collapsible.config';
export * from './container/container.config';
export * from './dynamic-grid/dynamic-grid.config';
export * from './gap.field';
export * from './grid-placement.field';
export * from './grid/grid.config';
export * from './items-alignment.field';
export * from './row/row.config';
export * from './slider/slider.config';
export * from './space/space.config';
