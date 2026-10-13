import { act, renderHook } from '@testing-library/react';

import { useAutosave } from './useAutosave';

type Props = Parameters<typeof useAutosave>[0];

const renderAutosave = (initial: Partial<Props> = {}) => {
  const onAutosave = vi.fn().mockResolvedValue(undefined);
  const props: Props = {
    enabled: true,
    hasChanged: true,
    onAutosave,
    ...initial,
  };

  const rendered = renderHook((p: Props) => useAutosave(p), {
    initialProps: props,
  });

  return {
    ...rendered,
    props,
    onAutosave: props.onAutosave as typeof onAutosave,
  };
};

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves 30 seconds after mount when there are changes', async () => {
    const { onAutosave } = renderAutosave();

    await advance(29_999);
    expect(onAutosave).not.toHaveBeenCalled();

    await advance(1);
    expect(onAutosave).toHaveBeenCalledTimes(1);
  });

  it('does not save when nothing changed and re-arms for the next interval', async () => {
    const { onAutosave, rerender, props } = renderAutosave({
      hasChanged: false,
    });

    await advance(30_000);
    expect(onAutosave).not.toHaveBeenCalled();

    rerender({ ...props, hasChanged: true });

    await advance(29_999);
    expect(onAutosave).not.toHaveBeenCalled();

    await advance(1);
    expect(onAutosave).toHaveBeenCalledTimes(1);
  });

  it('keeps saving every 30 seconds while changes remain', async () => {
    const { onAutosave } = renderAutosave();

    await advance(30_000);
    await advance(30_000);
    expect(onAutosave).toHaveBeenCalledTimes(2);
  });

  it('restarts the countdown when markSaved is called', async () => {
    const { onAutosave, result } = renderAutosave();

    await advance(20_000);
    act(() => result.current.markSaved());

    await advance(29_999);
    expect(onAutosave).not.toHaveBeenCalled();

    await advance(1);
    expect(onAutosave).toHaveBeenCalledTimes(1);
  });

  it('never saves when disabled', async () => {
    const { onAutosave } = renderAutosave({ enabled: false });

    await advance(90_000);
    expect(onAutosave).not.toHaveBeenCalled();
  });

  it('does not reset the countdown when re-rendered with a new callback', async () => {
    const { rerender, props } = renderAutosave();
    const next = vi.fn().mockResolvedValue(undefined);

    await advance(20_000);
    rerender({ ...props, onAutosave: next });

    await advance(10_000);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('waits a full interval after a save that disabled it while running', async () => {
    let resolveSave: () => void = () => undefined;
    const onAutosave = vi.fn(
      () => new Promise<void>(resolve => (resolveSave = resolve))
    );
    const { rerender, props } = renderAutosave({ onAutosave });

    await advance(30_000);
    expect(onAutosave).toHaveBeenCalledTimes(1);

    rerender({ ...props, enabled: false });
    await act(async () => resolveSave());
    rerender({ ...props, enabled: true });

    await advance(29_999);
    expect(onAutosave).toHaveBeenCalledTimes(1);

    await advance(1);
    expect(onAutosave).toHaveBeenCalledTimes(2);
  });

  it('retries on the next interval when saving fails', async () => {
    const onAutosave = vi.fn().mockRejectedValue(new Error('offline'));
    renderAutosave({ onAutosave });

    await advance(30_000);
    await advance(30_000);
    expect(onAutosave).toHaveBeenCalledTimes(2);
  });

  it('stops saving after unmount', async () => {
    const { onAutosave, unmount } = renderAutosave();

    unmount();
    await advance(60_000);
    expect(onAutosave).not.toHaveBeenCalled();
  });
});
