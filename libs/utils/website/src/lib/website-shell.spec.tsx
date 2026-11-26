import { render, renderHook } from '@testing-library/react';
import { useReportPageShell } from '@wepublish/website/builder';

import {
  getLiveWebsiteShell,
  getPageShell,
  getWebsiteShell,
  useLiveWebsiteShell,
} from './website-shell';

describe('getWebsiteShell', () => {
  it('shows navigation and footer by default', () => {
    expect(getWebsiteShell({})).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });

  it('defaults when the page props are empty', () => {
    expect(getWebsiteShell(undefined)).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });

  it('hides what the page asks to hide', () => {
    expect(getWebsiteShell({ shell: { showFooter: false } })).toEqual({
      showNavigation: true,
      showFooter: false,
    });
  });

  it('hides navigation and footer together', () => {
    expect(
      getWebsiteShell({ shell: { showNavigation: false, showFooter: false } })
    ).toEqual({
      showNavigation: false,
      showFooter: false,
    });
  });

  it('ignores unrelated page props', () => {
    expect(getWebsiteShell({ sessionToken: 'foo' } as never)).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });
});

describe('getPageShell', () => {
  it('shows navigation and footer when there is no page', () => {
    expect(getPageShell(undefined)).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });

  it('shows navigation and footer by default', () => {
    expect(getPageShell({ hideHeader: false, hideFooter: false })).toEqual({
      showNavigation: true,
      showFooter: true,
    });
  });

  it('hides only the navigation when the page hides its header', () => {
    expect(getPageShell({ hideHeader: true, hideFooter: false })).toEqual({
      showNavigation: false,
      showFooter: true,
    });
  });

  it('hides only the footer when the page hides its footer', () => {
    expect(getPageShell({ hideHeader: false, hideFooter: true })).toEqual({
      showNavigation: true,
      showFooter: false,
    });
  });

  it('hides navigation and footer together', () => {
    expect(getPageShell({ hideHeader: true, hideFooter: true })).toEqual({
      showNavigation: false,
      showFooter: false,
    });
  });
});

describe('getLiveWebsiteShell', () => {
  it('keeps the shell of the page props while no page loaded in the browser', () => {
    expect(
      getLiveWebsiteShell(
        { shell: { showNavigation: false, showFooter: true } },
        undefined
      )
    ).toEqual({ showNavigation: false, showFooter: true });
  });

  it('follows the page loaded in the browser over the server-side shell', () => {
    expect(
      getLiveWebsiteShell(
        { shell: { showNavigation: true, showFooter: true } },
        { hideHeader: true, hideFooter: true }
      )
    ).toEqual({ showNavigation: false, showFooter: false });
  });

  it('shows again what the page loaded in the browser no longer hides', () => {
    expect(
      getLiveWebsiteShell(
        { shell: { showNavigation: false, showFooter: false } },
        { hideHeader: false, hideFooter: false }
      )
    ).toEqual({ showNavigation: true, showFooter: true });
  });

  it('ignores the page flags on routes that never asked for a page shell', () => {
    expect(
      getLiveWebsiteShell({}, { hideHeader: true, hideFooter: true })
    ).toEqual({ showNavigation: true, showFooter: true });
  });
});

describe('useLiveWebsiteShell', () => {
  const Reporter = () => {
    useReportPageShell({ hideHeader: true, hideFooter: false });

    return null;
  };

  it('applies the flags of the page on screen to the page props shell', () => {
    const shell = renderHook(() =>
      useLiveWebsiteShell({
        shell: { showNavigation: true, showFooter: true },
      })
    );
    const reporter = render(<Reporter />);

    expect(shell.result.current).toEqual({
      showNavigation: false,
      showFooter: true,
    });

    reporter.unmount();
  });
});
