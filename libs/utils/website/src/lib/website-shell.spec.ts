import { getWebsiteShell } from './website-shell';

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
