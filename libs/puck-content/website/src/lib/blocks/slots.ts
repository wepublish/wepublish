import { PuckSlotComponent, PuckSlots } from './block.types';
import { EmptySlot } from './slots.component';

export const getSlot = (slots: PuckSlots, key: string): PuckSlotComponent =>
  slots[key] ?? EmptySlot;
