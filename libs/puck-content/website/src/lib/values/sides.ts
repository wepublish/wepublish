import { SpacingValue } from './spacing';

export type Side = 'top' | 'right' | 'bottom' | 'left';
export const sides: Side[] = ['top', 'right', 'bottom', 'left'];

export type SidesValue = Partial<Record<Side, SpacingValue>>;
