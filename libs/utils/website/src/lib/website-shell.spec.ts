import { getPageShell, getWebsiteShell } from './website-shell';

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
