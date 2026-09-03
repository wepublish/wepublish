import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  SessionTokenContext,
  setPreviewHandshakeState,
} from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { SensitiveDataUser } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps, ReactNode } from 'react';

import { PreviewStatusBanner } from './preview-status-banner';

const elements = {
  Link: ({ children, href }: ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
};

const renderBanner = (ui: ReactNode = <PreviewStatusBanner />) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <WebsiteBuilderProvider elements={elements}>{ui}</WebsiteBuilderProvider>
    </ThemeProvider>
  );

const withUser = (user: SensitiveDataUser | null, hasUser: boolean) => (
  <SessionTokenContext.Provider
    value={[user, hasUser, vi.fn().mockResolvedValue(undefined)]}
  >
    <PreviewStatusBanner />
  </SessionTokenContext.Provider>
);

describe('PreviewStatusBanner', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    Object.defineProperty(window, 'opener', {
      value: null,
      configurable: true,
      writable: true,
    });
    document.cookie = 'auth.token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setPreviewHandshakeState('unknown');
  });

  it('renders nothing without ?preview in the url', () => {
    const { container } = renderBanner();

    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for a user with the preview permission', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    const user = {
      permissions: [CanPreview.id],
    } as unknown as SensitiveDataUser;

    const { container } = renderBanner(withUser(user, true));

    expect(container.innerHTML).toBe('');
  });

  it('shows the loading state while the editor handshake is pending', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    setPreviewHandshakeState('pending');

    renderBanner();

    expect(screen.getByText('Vorschau wird geladen …')).toBeDefined();
  });

  it('shows the published-version hint when the handshake has failed', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    Object.defineProperty(window, 'opener', {
      value: window,
      configurable: true,
      writable: true,
    });
    setPreviewHandshakeState('failed');

    renderBanner();

    expect(
      screen.getByText(/Du siehst die veröffentlichte Version/)
    ).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });

  it('shows the published-version hint when the user lacks the preview permission', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');
    document.cookie = 'auth.token=some-token';
    const user = { permissions: [] } as unknown as SensitiveDataUser;

    renderBanner(withUser(user, true));

    expect(
      screen.getByText(/Du siehst die veröffentlichte Version/)
    ).toBeDefined();
    expect(screen.queryByText('Vorschau wird geladen …')).toBeNull();
  });
});
