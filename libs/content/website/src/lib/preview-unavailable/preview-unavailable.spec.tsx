import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  SessionTokenContext,
  setPreviewHandshakeState,
} from '@wepublish/authentication/website';
import { FullSensitiveDataUserFragment } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { PreviewUnavailable } from './preview-unavailable';

type BuilderElements = ComponentProps<
  typeof WebsiteBuilderProvider
>['elements'];

const elements = {
  H5: ({ children }: PropsWithChildren<{ component?: string }>) => (
    <h5>{children}</h5>
  ),
  Paragraph: ({ children }: PropsWithChildren) => <p>{children}</p>,
  Link: ({ children, href }: ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
};

const renderWithTheme = (ui: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <WebsiteBuilderProvider elements={elements as BuilderElements}>
        {ui}
      </WebsiteBuilderProvider>
    </ThemeProvider>
  );

describe('PreviewUnavailable', () => {
  // The handshake window is measured against performance.now(), which keeps
  // counting across all files sharing a vitest worker - pin it so the pending
  // state stays reachable no matter how long the suite has been running.
  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    Object.defineProperty(window, 'opener', {
      value: null,
      configurable: true,
      writable: true,
    });
    document.cookie = 'auth.token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setPreviewHandshakeState('unknown');
    vi.restoreAllMocks();
  });

  it('renders nothing without ?preview in the url', () => {
    const { container } = renderWithTheme(<PreviewUnavailable />);

    expect(container.innerHTML).toBe('');
  });

  it('shows the login hint directly when no authentication can arrive', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });

  it('shows the pending state while the editor handshake can still deliver a login', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau wird geladen …')).toBeDefined();
  });

  it('shows the login hint directly when the handshake has failed', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    setPreviewHandshakeState('failed');

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });

  it('shows the login hint directly after logout in a tab whose handshake already succeeded', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    setPreviewHandshakeState('succeeded');

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });

  it('keeps showing the pending state right after the editor handshake logged in, also when scripts cannot read the session cookie', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    setPreviewHandshakeState('succeeded');

    renderWithTheme(
      <SessionTokenContext.Provider
        value={[undefined, true, vi.fn().mockResolvedValue(undefined)]}
      >
        <PreviewUnavailable />
      </SessionTokenContext.Provider>
    );

    expect(screen.getByText('Vorschau wird geladen …')).toBeDefined();
  });

  it('shows the login hint directly when the user lacks the preview permission', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    document.cookie = 'auth.token=some-token';
    const user = {
      permissions: [],
    } as unknown as FullSensitiveDataUserFragment;

    renderWithTheme(
      <SessionTokenContext.Provider
        value={[user, true, vi.fn().mockResolvedValue(undefined)]}
      >
        <PreviewUnavailable />
      </SessionTokenContext.Provider>
    );

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });

  it('shows the login hint directly when the handshake window has passed', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(60_000);

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();

    nowSpy.mockRestore();
  });

  it('shows the pending state while a session cookie may authorize the preview', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    document.cookie = 'auth.token=some-token';

    renderWithTheme(<PreviewUnavailable />);

    expect(screen.getByText('Vorschau wird geladen …')).toBeDefined();
  });
});
