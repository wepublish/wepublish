import { renderHook } from '@testing-library/react';

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

    const { result } = renderHook(() =>
      usePrefillOnce<Source, ReturnType<typeof toPrefill>>(
        undefined,
        toPrefill,
        onPrefill
      )
    );

    expect(onPrefill).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
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

  it('should be prefilling until the source has been handed over', () => {
    const onPrefill = vi.fn();
    const renders: { prefilling: boolean; prefilled: boolean }[] = [];

    const { result } = renderHook(() => {
      const prefilling = usePrefillOnce(
        { id: '1', name: 'First' },
        toPrefill,
        onPrefill
      );
      renders.push({ prefilling, prefilled: onPrefill.mock.calls.length > 0 });

      return prefilling;
    });

    expect(renders[0]).toEqual({ prefilling: true, prefilled: false });
    expect(result.current).toBe(false);
  });
});
