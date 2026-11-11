import { render, renderHook } from '@testing-library/react';
import { act } from 'react';

import {
  PageShellFlags,
  usePageShell,
  useReportPageShell,
} from './use-page-shell';

const Reporter = ({ page }: { page?: PageShellFlags | null }) => {
  useReportPageShell(page);

  return null;
};

describe('usePageShell', () => {
  it('is undefined while no page reported its flags', () => {
    expect(renderHook(() => usePageShell()).result.current).toBeUndefined();
  });

  it('follows the flags of the rendered page', () => {
    const shell = renderHook(() => usePageShell());
    const reporter = render(
      <Reporter page={{ hideHeader: true, hideFooter: false }} />
    );

    expect(shell.result.current).toEqual({
      hideHeader: true,
      hideFooter: false,
    });

    reporter.rerender(
      <Reporter page={{ hideHeader: false, hideFooter: true }} />
    );

    expect(shell.result.current).toEqual({
      hideHeader: false,
      hideFooter: true,
    });

    reporter.unmount();
  });

  it('forgets the flags once the page is gone', () => {
    const shell = renderHook(() => usePageShell());
    const reporter = render(
      <Reporter page={{ hideHeader: true, hideFooter: true }} />
    );

    act(() => reporter.unmount());

    expect(shell.result.current).toBeUndefined();
  });

  it('reports nothing while the page has not loaded', () => {
    const shell = renderHook(() => usePageShell());
    const reporter = render(<Reporter page={undefined} />);

    expect(shell.result.current).toBeUndefined();

    reporter.unmount();
  });

  it('keeps the flags of a newer page when an older one unmounts', () => {
    const shell = renderHook(() => usePageShell());
    const older = render(
      <Reporter page={{ hideHeader: false, hideFooter: false }} />
    );
    const newer = render(
      <Reporter page={{ hideHeader: true, hideFooter: true }} />
    );

    act(() => older.unmount());

    expect(shell.result.current).toEqual({
      hideHeader: true,
      hideFooter: true,
    });

    newer.unmount();
  });
});
