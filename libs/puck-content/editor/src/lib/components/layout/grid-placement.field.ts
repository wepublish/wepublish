import {
  BreakpointsValue,
  GridPlacementValue,
} from '@wepublish/puck-content/website';

import {
  BreakpointsField,
  breakpointsFieldAi,
} from '../../breakpoints/breakpoints.field';
import {
  defaultGridColumns,
  gridLineSchema,
  gridPlacementFieldAi,
} from '../../grid-placement/grid-placement.field';

export const defaultGridPlacement: BreakpointsValue<GridPlacementValue> = {
  xs: { column: { span: 12 } },
  md: { column: { span: 6 } },
};

export const gridPlacementField = (
  columns = defaultGridColumns
): BreakpointsField<GridPlacementValue> => ({
  type: 'breakpoints',
  label: 'Placement',
  objectFields: {
    column: {
      type: 'gridPlacement',
      label: 'Columns',
      axis: 'column',
      columns,
      ai: gridPlacementFieldAi('column', columns),
    },
    row: {
      type: 'gridPlacement',
      label: 'Rows',
      axis: 'row',
      ai: gridPlacementFieldAi('row', columns),
    },
  },
  ai: breakpointsFieldAi({
    column: gridLineSchema('column', columns),
    row: gridLineSchema('row', columns),
  }),
});
