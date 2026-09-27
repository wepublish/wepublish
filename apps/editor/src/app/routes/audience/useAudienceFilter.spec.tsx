import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';

import { useAudienceFilter } from './useAudienceFilter';

vi.mock('@wepublish/editor/api', () => ({
  LocalStorageKey: { AudienceDashboardFilter: 'audienceDashboardFilter' },
}));

const STORAGE_KEY = 'audienceDashboardFilter';
const ROUTE = '/audience/dashboard';

let currentSearch = '';

function SearchProbe() {
  const [params] = useSearchParams();
  currentSearch = params.toString();
  return null;
}

const renderFilter = ({
  search = '',
  persist = true,
}: { search?: string; persist?: boolean } = {}) => {
  const fetchStats = vi.fn();

  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={[`${ROUTE}${search}`]}>
      {children}
      <SearchProbe />
    </MemoryRouter>
  );

  const rendered = renderHook(
    () => useAudienceFilter({ fetchStats, persist }),
    { wrapper }
  );

  return { ...rendered, fetchStats };
};

const stored = () => localStorage.getItem(STORAGE_KEY);

beforeEach(() => {
  currentSearch = '';
  localStorage.clear();
});

describe('useAudienceFilter', () => {
  it('restores the selection from the URL', () => {
    const { result } = renderFilter({
      search:
        '?resolution=monthly&metrics=endingSubscriptionCount&show=table&plans=abc',
    });

    expect(result.current.resolution).toBe('monthly');
    expect(result.current.audienceClientFilter).toMatchObject({
      endingSubscriptionCount: true,
      createdSubscriptionCount: false,
    });
    expect(result.current.audienceComponentFilter).toMatchObject({
      chart: false,
      table: true,
    });
    expect(result.current.audienceApiFilter.memberPlanIds).toEqual(['abc']);
  });

  it('prefers the URL over what this browser remembers', () => {
    localStorage.setItem(STORAGE_KEY, 'resolution=monthly');

    const { result } = renderFilter({ search: '?resolution=daily' });

    expect(result.current.resolution).toBe('daily');
  });

  it('falls back to storage when the URL carries no filter', () => {
    localStorage.setItem(STORAGE_KEY, 'resolution=monthly');

    const { result } = renderFilter({ search: '?something=else' });

    expect(result.current.resolution).toBe('monthly');
  });

  it('starts from the defaults when there is nothing to restore', () => {
    const { result } = renderFilter();

    expect(result.current.resolution).toBe('daily');
    expect(result.current.audienceComponentFilter).toMatchObject({
      chart: true,
      table: false,
    });
  });

  it('loads the restored range on mount', () => {
    const { fetchStats } = renderFilter({
      search: '?from=2026-03-03&to=2026-04-17',
    });

    expect(fetchStats).toHaveBeenCalledTimes(1);

    const { start, end } = fetchStats.mock.calls[0][0].variables;

    expect(new Date(start).getDate()).toBe(3);
    expect(new Date(end).getDate()).toBe(17);
  });

  it('writes a change to the URL and to storage', () => {
    const { result } = renderFilter();

    act(() => result.current.setResolution('monthly'));

    expect(currentSearch).toContain('resolution=monthly');
    expect(stored()).toContain('resolution=monthly');
  });

  it('keeps a rolling range in the URL', () => {
    renderFilter();

    expect(currentSearch).toContain('range=lastMonth');
    expect(currentSearch).not.toContain('from=');
  });

  it('leaves the URL and storage alone when persistence is off', () => {
    const { result } = renderFilter({ persist: false });

    act(() => result.current.setResolution('monthly'));

    expect(currentSearch).toBe('');
    expect(stored()).toBeNull();
  });

  it('keeps parameters that belong to someone else', () => {
    const { result } = renderFilter({ search: '?tab=jobs' });

    act(() => result.current.setResolution('monthly'));

    expect(currentSearch).toContain('tab=jobs');
  });

  it('pins the date range in a permalink', () => {
    const { result } = renderFilter();

    const permalink = result.current.buildPermalink();

    expect(permalink).toContain('from=');
    expect(permalink).toContain('to=');
    expect(permalink).not.toContain('range=');
    expect(permalink.startsWith(`${window.location.origin}${ROUTE}?`)).toBe(
      true
    );
  });
});
