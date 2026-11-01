export type GridPlacementAxis = 'column' | 'row';
export const gridPlacementAxes: GridPlacementAxis[] = ['column', 'row'];

export type GridLine = {
  start?: number;
  span?: number;
};

export type GridPlacementValue = Partial<Record<GridPlacementAxis, GridLine>>;
