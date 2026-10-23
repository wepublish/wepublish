import { act, renderHook } from '@testing-library/react';

import { useListViewState } from './use-list-view-state';

describe('useListViewState', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('writes filter and sort together with update, so neither overwrites the other', () => {
    const { result } = renderHook(() =>
      useListViewState<{ reviewRequested?: boolean }>('update-spec')
    );

    act(() => {
      result.current.update({
        filter: { reviewRequested: true },
        sortField: 'reviewRequestedAt',
        sortOrder: 'asc',
      });
    });

    expect(result.current.filter).toEqual({ reviewRequested: true });
    expect(result.current.sortField).toBe('reviewRequestedAt');
    expect(result.current.sortOrder).toBe('asc');
    expect(result.current.limit).toBe(10);
  });

  it('keeps what update leaves out', () => {
    const { result } = renderHook(() =>
      useListViewState<{ search?: string }>('update-spec', {
        defaultSortField: 'name',
        defaultSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.update({ filter: { search: 'jazz' } });
    });

    expect(result.current.filter).toEqual({ search: 'jazz' });
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
  });
});
