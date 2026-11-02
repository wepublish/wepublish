import { shouldDisplayBlock, siteTimeZone, TimedBlock } from './block-timing';

type FlexEntry = { block?: TimedBlock | null };
type Template = { blocks?: unknown } | null | undefined;

export type DisplayedBlocksOptions = {
  timeZone?: string;
  onTemplateRebuilt?: (template: object, original: object) => void;
};

const displayedEntries = <T>(
  entries: readonly T[],
  pick: (entry: T) => TimedBlock | null | undefined,
  replace: (entry: T, block: TimedBlock) => T,
  now: Date,
  timeZone: string,
  options: DisplayedBlocksOptions
) => {
  let changed = false;
  const kept: T[] = [];

  for (const entry of entries) {
    const block = pick(entry);

    if (!block) {
      kept.push(entry);
      continue;
    }

    if (!shouldDisplayBlock(block, now, timeZone)) {
      changed = true;
      continue;
    }

    const displayed = displayNested(block, now, timeZone, options);
    changed ||= displayed !== block;
    kept.push(displayed === block ? entry : replace(entry, displayed));
  }

  return changed ? kept : entries;
};

const displayNested = (
  block: TimedBlock,
  now: Date,
  timeZone: string,
  options: DisplayedBlocksOptions
): TimedBlock => {
  let nested = block;

  if (Array.isArray(block.blocks)) {
    const blocks = displayedEntries(
      block.blocks as FlexEntry[],
      entry => entry?.block,
      (entry, displayed) => ({ ...entry, block: displayed }),
      now,
      timeZone,
      options
    );

    if (blocks !== block.blocks) {
      nested = { ...nested, blocks };
    }
  }

  const template = block.template as Template;

  if (Array.isArray(template?.blocks)) {
    const blocks = displayedEntries(
      template.blocks as TimedBlock[],
      entry => entry,
      (entry, displayed) => displayed,
      now,
      timeZone,
      options
    );

    if (blocks !== template.blocks) {
      const rebuilt = { ...template, blocks };
      options.onTemplateRebuilt?.(rebuilt, template);
      nested = { ...nested, template: rebuilt };
    }
  }

  return nested;
};

export const displayedBlocks = <T>(
  blocks: readonly T[],
  now: Date,
  options: DisplayedBlocksOptions = {}
): T[] =>
  displayedEntries(
    blocks,
    entry => entry as TimedBlock,
    (entry, displayed) => displayed as T,
    now,
    options.timeZone ?? siteTimeZone(),
    options
  ) as T[];
