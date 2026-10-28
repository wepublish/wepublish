import { BlockValue, useSeededState } from '@wepublish/ui/editor';

export type TemplatePrefill<Metadata> = {
  name: string;
  blocks: BlockValue[];
  metadata: Metadata;
};

/**
 * Hands `source` over to `onPrefill` once per source id. The hand-over happens
 * while rendering, so the prefilled values are already in the caller's state
 * on the first commit that has the source.
 */
export function usePrefillOnce<Source extends { id: string }, Prefill>(
  source: Source | null | undefined,
  toPrefill: (source: Source) => Prefill,
  onPrefill: (prefill: Prefill) => void
) {
  useSeededState(source, value => onPrefill(toPrefill(value)), source?.id);
}
