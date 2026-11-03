import { SpacingValue } from './spacing';

export type GapAxis = 'row' | 'column';
export const gapAxes: GapAxis[] = ['row', 'column'];

export type GapValue = Partial<Record<GapAxis, SpacingValue>>;
