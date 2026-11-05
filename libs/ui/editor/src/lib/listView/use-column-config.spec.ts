import { act, renderHook } from '@testing-library/react';

import { useColumnConfig } from './use-column-config';

const columns = [
  { id: 'title', label: 'Title', alwaysVisible: true },
  { id: 'author', label: 'Author' },
  { id: 'updated', label: 'Updated' },
];

describe('useColumnConfig', () => {
  beforeEach(() => localStorage.clear());

  it('starts with every column visible', () => {
    const { result } = renderHook(() => useColumnConfig('test', columns));

    expect(result.current.hiddenColumns).toEqual([]);
  });

  it('reports a column the user switched off', () => {
    const { result } = renderHook(() => useColumnConfig('test', columns));

    act(() => result.current.toggle('author'));

    expect(result.current.hiddenColumns).toEqual(['author']);
    expect(result.current.isVisible('author')).toBe(false);
  });

  it('never reports an always-visible column as hidden', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test',
      JSON.stringify(['title'])
    );

    const { result } = renderHook(() => useColumnConfig('test', columns));

    expect(result.current.hiddenColumns).toEqual([]);
    expect(result.current.isVisible('title')).toBe(true);
  });

  it('hands back the same array until the selection changes', () => {
    const { result, rerender } = renderHook(() =>
      useColumnConfig('test', columns)
    );

    const first = result.current.hiddenColumns;
    rerender();

    expect(result.current.hiddenColumns).toBe(first);
  });

  it('keeps the last column the user could still switch off', () => {
    const { result } = renderHook(() =>
      useColumnConfig('test', [
        { id: 'author', label: 'Author' },
        { id: 'updated', label: 'Updated' },
      ])
    );

    act(() => result.current.toggle('author'));
    act(() => result.current.toggle('updated'));

    expect(result.current.hiddenColumns).toEqual(['author']);
    expect(result.current.isVisible('updated')).toBe(true);
  });

  it('lets the last switchable column go when the table keeps a column anyway', () => {
    const { result } = renderHook(() =>
      useColumnConfig('test', [
        { id: 'title', label: 'Title', alwaysVisible: true },
        { id: 'slug', label: 'Slug' },
      ])
    );

    act(() => result.current.toggle('slug'));

    expect(result.current.hiddenColumns).toEqual(['slug']);
  });
});

describe('useColumnConfig ordering', () => {
  const orderable = [
    { id: 'states', label: 'States', fixed: true },
    { id: 'title', label: 'Title' },
    { id: 'author', label: 'Author' },
    { id: 'updated', label: 'Updated' },
    { id: 'actions', label: 'Actions', fixed: true },
  ];

  beforeEach(() => localStorage.clear());

  it('leaves the columns as the list declared them', () => {
    const { result } = renderHook(() => useColumnConfig('test', orderable));

    expect(result.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'title',
      'author',
      'updated',
      'actions',
    ]);
  });

  it('puts a moved column where it was dropped', () => {
    const { result } = renderHook(() => useColumnConfig('test', orderable));

    act(() => result.current.move('updated', 'title'));

    expect(result.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'updated',
      'title',
      'author',
      'actions',
    ]);
  });

  it('keeps the columns the user cannot move where they are', () => {
    const { result } = renderHook(() => useColumnConfig('test', orderable));

    act(() => result.current.move('updated', 'title'));

    const ordered = result.current.orderColumns(orderable);

    expect(ordered[0].id).toBe('states');
    expect(ordered[ordered.length - 1].id).toBe('actions');
  });

  it('remembers the order for the next visit', () => {
    const { result, unmount } = renderHook(() =>
      useColumnConfig('test', orderable)
    );

    act(() => result.current.move('updated', 'title'));
    unmount();

    const { result: next } = renderHook(() =>
      useColumnConfig('test', orderable)
    );

    expect(next.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'updated',
      'title',
      'author',
      'actions',
    ]);
  });

  it('offers the menu every column the user may move', () => {
    const { result } = renderHook(() =>
      useColumnConfig('test', [
        { id: 'states', label: 'States', fixed: true },
        { id: 'title', label: 'Title', alwaysVisible: true },
        { id: 'author', label: 'Author' },
      ])
    );

    expect(result.current.menuColumns).toEqual([
      { id: 'title', label: 'Title', canHide: false },
      { id: 'author', label: 'Author', canHide: true },
    ]);
  });

  it('offers the menu its columns in the order they are shown', () => {
    const { result } = renderHook(() => useColumnConfig('test', orderable));

    act(() => result.current.move('updated', 'title'));

    expect(result.current.menuColumns.map(({ id }) => id)).toEqual([
      'updated',
      'title',
      'author',
    ]);
  });

  it('puts the columns back the way the list declared them', () => {
    const { result } = renderHook(() => useColumnConfig('test', orderable));

    act(() => result.current.move('updated', 'title'));
    act(() => result.current.toggle('author'));

    expect(result.current.isCustomised).toBe(true);

    act(() => result.current.reset());

    expect(result.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'title',
      'author',
      'updated',
      'actions',
    ]);
    expect(result.current.hiddenColumns).toEqual([]);
    expect(result.current.isCustomised).toBe(false);
  });

  it('ignores an order left over from columns the list no longer has', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test',
      JSON.stringify({ hidden: [], order: ['gone', 'updated', 'title'] })
    );

    const { result } = renderHook(() => useColumnConfig('test', orderable));

    expect(result.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'updated',
      'title',
      'author',
      'actions',
    ]);
  });

  it('still understands what an older editor stored', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test',
      JSON.stringify(['author'])
    );

    const { result } = renderHook(() => useColumnConfig('test', orderable));

    expect(result.current.hiddenColumns).toEqual(['author']);
    expect(result.current.orderColumns(orderable).map(({ id }) => id)).toEqual([
      'states',
      'title',
      'author',
      'updated',
      'actions',
    ]);
  });
});

// A table can add columns most users don't need: they start hidden and are
// switched on in the menu, and a reset hides them again.
describe('useColumnConfig hidden by default', () => {
  beforeEach(() => localStorage.clear());

  const withExtra = [
    { id: 'title', label: 'Title', alwaysVisible: true },
    { id: 'author', label: 'Author' },
    { id: 'updated', label: 'Updated', defaultHidden: true },
  ];

  it('starts with a default-hidden column hidden', () => {
    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    expect(result.current.hiddenColumns).toEqual(['updated']);
    expect(result.current.isVisible('updated')).toBe(false);
    expect(result.current.isCustomised).toBe(false);
  });

  it('shows it once the user switches it on, and remembers that', () => {
    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    act(() => result.current.toggle('updated'));

    expect(result.current.isVisible('updated')).toBe(true);
    expect(result.current.isCustomised).toBe(true);

    const { result: nextVisit } = renderHook(() =>
      useColumnConfig('test', withExtra)
    );
    expect(nextVisit.current.isVisible('updated')).toBe(true);
  });

  it('hides it again when the user switches it off', () => {
    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    act(() => result.current.toggle('updated'));
    act(() => result.current.toggle('updated'));

    expect(result.current.isVisible('updated')).toBe(false);
  });

  it('hides it again on reset', () => {
    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    act(() => result.current.toggle('updated'));
    act(() => result.current.reset());

    expect(result.current.isVisible('updated')).toBe(false);
  });

  it('keeps it hidden for users who stored a choice before it existed', () => {
    localStorage.setItem(
      'wepublish:editor:columns:test',
      JSON.stringify({ hidden: ['author'], order: [] })
    );

    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    expect(result.current.hiddenColumns).toEqual(['author', 'updated']);
  });

  it('still lets the user switch other columns off', () => {
    const { result } = renderHook(() => useColumnConfig('test', withExtra));

    act(() => result.current.toggle('author'));

    expect(result.current.hiddenColumns).toEqual(['author', 'updated']);
  });
});
