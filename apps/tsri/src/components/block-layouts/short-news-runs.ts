import { FullFlexBlockFragment } from '@wepublish/website/api';

import { TsriLayoutType } from '../teaser-layouts/tsri-layout';

export type FlexEntry = FullFlexBlockFragment['blocks'][number];

const isShortNewsEntry = (entry: FlexEntry) =>
  entry.block?.__typename === 'TeaserSlotsBlock' &&
  entry.block.blockStyle === TsriLayoutType.CompactNews;

const isXLTeasersEntry = (entry: FlexEntry) =>
  entry.block?.__typename === 'TeaserSlotsBlock' &&
  entry.block.blockStyle === TsriLayoutType.XLFullsizeImage;

const isMergeableEntry = (entry: FlexEntry) =>
  isShortNewsEntry(entry) || isXLTeasersEntry(entry);

export const groupShortNewsRuns = (entries: FlexEntry[]) => {
  const runs: Array<{ mergeable: boolean; entries: FlexEntry[] }> = [];

  for (const entry of entries) {
    const lastRun = runs[runs.length - 1];

    if (lastRun?.mergeable && isMergeableEntry(entry)) {
      lastRun.entries.push(entry);
    } else {
      runs.push({ mergeable: isMergeableEntry(entry), entries: [entry] });
    }
  }

  return runs.map(run => ({
    merged:
      run.mergeable &&
      run.entries.some(isShortNewsEntry) &&
      run.entries.some(isXLTeasersEntry),
    entries: run.entries,
  }));
};
