import {
  ApiBlock,
  ApiBlockTimings,
  filterPuckBlocks,
} from '@wepublish/puck-content/api';

import {
  nextTimingChange,
  shouldDisplayBlock,
  siteTimeZone,
  TimedBlock,
} from './block-timing';
import { BlockTiming, Weekday } from './block-timing.model';

const weekdaysByName = new Map<string, Weekday>(Object.entries(Weekday));

const timingOf = (
  timings: ApiBlockTimings | null | undefined
): BlockTiming | null =>
  timings ?
    ({
      ...timings,
      weekdays: timings.weekdays?.map(day => weekdaysByName.get(day) ?? day),
    } as unknown as BlockTiming)
  : null;

const timedBlockOf = ({ visibility }: ApiBlock): TimedBlock => ({
  disabled: visibility?.disabled === true,
  timing: timingOf(visibility?.timings),
});

const timedTreeOf = (blocks: ApiBlock[]): TimedBlock[] =>
  blocks.map(block => ({
    ...timedBlockOf(block),
    blocks: timedTreeOf(block.children ?? []),
  }));

export const displayedPuckBlocks = (
  blocks: ApiBlock[],
  now: Date,
  timeZone = siteTimeZone()
): ApiBlock[] =>
  filterPuckBlocks(blocks, block =>
    shouldDisplayBlock(timedBlockOf(block), now, timeZone)
  );

export const nextPuckBlocksTimingChange = (
  blocks: ApiBlock[],
  now: Date,
  timeZone = siteTimeZone()
): Date | null => nextTimingChange(timedTreeOf(blocks), now, timeZone);
