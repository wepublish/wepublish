import { act, render, renderHook } from '@testing-library/react';
import { useState } from 'react';

import { useSeededState } from './use-seeded-state';

type Author = { id: string; name: string };

const usePanel = (author?: Author) => {
  const [name, setName] = useState('');
  useSeededState(author, loaded => setName(loaded.name));

  return { name, setName };
};

describe('useSeededState', () => {
  it('leaves state alone while there is nothing to seed from', () => {
    const { result } = renderHook(() => usePanel(undefined));

    expect(result.current.name).toBe('');
  });

  it('seeds once the value arrives', () => {
    const { result, rerender } = renderHook(({ author }) => usePanel(author), {
      initialProps: { author: undefined as Author | undefined },
    });

    rerender({ author: { id: '1', name: 'Ada' } });

    expect(result.current.name).toBe('Ada');
  });

  it('does not undo edits when the same value comes round again', () => {
    const author = { id: '1', name: 'Ada' };
    const { result, rerender } = renderHook(() => usePanel(author));

    act(() => result.current.setName('Grace'));
    rerender();

    expect(result.current.name).toBe('Grace');
  });

  it('seeds again when a different value arrives', () => {
    const { result, rerender } = renderHook(({ author }) => usePanel(author), {
      initialProps: { author: { id: '1', name: 'Ada' } },
    });

    rerender({ author: { id: '2', name: 'Grace' } });

    expect(result.current.name).toBe('Grace');
  });

  it('seeds from a value that is already there on the first render', () => {
    const author = { id: '1', name: 'Ada' };
    const { result } = renderHook(() => usePanel(author));

    expect(result.current.name).toBe('Ada');
  });

  it('keys on what the caller says identifies the value', () => {
    const { result, rerender } = renderHook(
      ({ author }) => {
        const [name, setName] = useState('');
        useSeededState(author, loaded => setName(loaded.name), author?.id);
        return { name, setName };
      },
      { initialProps: { author: { id: '1', name: 'Ada' } as Author } }
    );

    act(() => result.current.setName('Grace'));
    rerender({ author: { id: '1', name: 'Ada' } });

    expect(result.current.name).toBe('Grace');
  });
});

it('treats NaN as the same value it already seeded', () => {
  const seed = vi.fn();

  const Probe = ({ source }: { source: number }) => {
    useSeededState(source, seed);

    return null;
  };

  const { rerender } = render(<Probe source={Number.NaN} />);
  rerender(<Probe source={Number.NaN} />);

  expect(seed).toHaveBeenCalledTimes(1);
});
