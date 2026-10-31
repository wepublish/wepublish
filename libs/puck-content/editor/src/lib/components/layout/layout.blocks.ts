import { withCSS } from '../../blocks/with-css';
import {
  DatasourceSettings,
  withDataSource,
} from '../../blocks/with-datasource';
import { withVisibility } from '../../blocks/with-visibility';
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
  Space: withVisibility(Space),
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

export * from './collapsible/collapsible.config';
export * from './column-span.field';
export * from './container/container.config';
export * from './dynamic-grid/dynamic-grid.config';
export * from './gap.field';
export * from './grid/grid.config';
export * from './items-alignment.field';
export * from './row/row.config';
export * from './slider/slider.config';
export * from './space/space.config';
