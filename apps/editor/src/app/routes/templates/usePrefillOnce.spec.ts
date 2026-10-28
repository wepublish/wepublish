import { renderHook } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';

import { usePrefillOnce } from './usePrefillOnce';

type Source = { id: string; name: string };

const toPrefill = ({ name }: Source) => ({
  name,
  blocks: [],
  metadata: {},
});

describe('usePrefillOnce', () => {
  it('should not prefill without a source', () => {
    const onPrefill = vi.fn();

    renderHook(() =>
      usePrefillOnce<Source, ReturnType<typeof toPrefill>>(
        undefined,
        toPrefill,
        onPrefill
      )
    );

    expect(onPrefill).not.toHaveBeenCalled();
  });

  it('should prefill a source once', () => {
    const onPrefill = vi.fn();

    const { rerender } = renderHook(
      ({ source }: { source: Source }) =>
        usePrefillOnce(source, toPrefill, onPrefill),
      { initialProps: { source: { id: '1', name: 'First' } } }
    );

    rerender({ source: { id: '1', name: 'Changed' } });

    expect(onPrefill).toHaveBeenCalledTimes(1);
    expect(onPrefill).toHaveBeenCalledWith({
      name: 'First',
      blocks: [],
      metadata: {},
    });
  });

  it('should prefill again for another source', () => {
    const onPrefill = vi.fn();

    const { rerender } = renderHook(
      ({ source }: { source: Source }) =>
        usePrefillOnce(source, toPrefill, onPrefill),
      { initialProps: { source: { id: '1', name: 'First' } } }
    );

    rerender({ source: { id: '2', name: 'Second' } });

    expect(onPrefill).toHaveBeenCalledTimes(2);
    expect(onPrefill).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'Second' })
    );
  });

  it('should hand the source over before the first commit', () => {
    const committed: (string | null)[] = [];

    renderHook(() => {
      const [name, setName] = useState<string | null>(null);

      usePrefillOnce({ id: '1', name: 'First' }, toPrefill, prefill =>
        setName(prefill.name)
      );
      useLayoutEffect(() => {
        committed.push(name);
      });
    });

    expect(committed).toEqual(['First']);
  });
});
