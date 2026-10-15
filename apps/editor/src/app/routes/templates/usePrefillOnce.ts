import { BlockValue } from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';

export type TemplatePrefill<Metadata> = {
  name: string;
  blocks: BlockValue[];
  metadata: Metadata;
};

/**
 * Hands `source` over to `onPrefill` once per source id. Returns whether the
 * source is still waiting to be handed over, so callers can keep showing a
 * loader until the prefilled values are in their state.
 */
export function usePrefillOnce<Source extends { id: string }, Prefill>(
  source: Source | null | undefined,
  toPrefill: (source: Source) => Prefill,
  onPrefill: (prefill: Prefill) => void
) {
  const [prefilledId, setPrefilledId] = useState<string | null>(null);

  useEffect(() => {
    if (!source || prefilledId === source.id) {
      return;
    }

    setPrefilledId(source.id);
    onPrefill(toPrefill(source));
  }, [source, prefilledId, toPrefill, onPrefill]);

  return !!source && prefilledId !== source.id;
}
