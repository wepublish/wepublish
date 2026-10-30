import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  SessionTokenContext,
  setPreviewHandshakeState,
} from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { SensitiveDataUser } from '@wepublish/website/api';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { ComponentProps, PropsWithChildren, ReactNode } from 'react';

import { ContentUnavailable } from './content-unavailable';

type BuilderElements = ComponentProps<
  typeof WebsiteBuilderProvider
>['elements'];

const NOTE = 'Dieser Inhalt ist nicht verfügbar';

const elements = {
  H5: ({ children }: PropsWithChildren<{ component?: string }>) => (
    <h5>{children}</h5>
  ),
  Paragraph: ({ children }: PropsWithChildren) => <p>{children}</p>,
  Link: ({ children, href }: ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
};

const withProviders = (ui: ReactNode, user?: SensitiveDataUser) => (
  <ThemeProvider theme={createTheme()}>
    <WebsiteBuilderProvider elements={elements as BuilderElements}>
      {user ?
        <SessionTokenContext.Provider
          value={[user, true, vi.fn().mockResolvedValue(undefined)]}
        >
          {ui}
        </SessionTokenContext.Provider>
      : ui}
    </WebsiteBuilderProvider>
  </ThemeProvider>
);

describe('ContentUnavailable', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    window.sessionStorage.clear();
    Object.defineProperty(window, 'opener', {
      value: null,
      configurable: true,
      writable: true,
    });
    document.cookie = 'auth.token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setPreviewHandshakeState('unknown');
  });

  it('tells visitors who cannot preview that the content is not available', () => {
    render(withProviders(<ContentUnavailable />));

    expect(screen.getByText(NOTE)).toBeDefined();
  });

  it('tells a logged-in reader without preview rights the same', () => {
    document.cookie = 'auth.token=some-token';

    render(
      withProviders(<ContentUnavailable />, {
        permissions: [],
      } as unknown as SensitiveDataUser)
    );

    expect(screen.getByText(NOTE)).toBeDefined();
  });

  it.each<[string, () => void]>([
    [
      'when the editor opened the preview (?preview)',
      () => window.history.replaceState(null, '', '/a/foobar?preview'),
    ],
    [
      'when the editor opened the preview and the handshake is still running',
      () => {
        window.history.replaceState(null, '', '/a/foobar?preview');
        Object.defineProperty(window, 'opener', {
          value: window,
          configurable: true,
          writable: true,
        });
      },
    ],
    [
      'in preview mode switched on in the admin bar',
      () => window.sessionStorage.setItem('PREVIEW_MODE', '1'),
    ],
    [
      'while a login is still loading',
      () => {
        document.cookie = 'auth.token=some-token';
      },
    ],
  ])('never shows the note %s', (_, arrange) => {
    arrange();

    render(withProviders(<ContentUnavailable />));

    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('never shows the note to an editor who may preview', () => {
    document.cookie = 'auth.token=some-token';

    render(
      withProviders(<ContentUnavailable />, {
        permissions: [CanPreview.id],
      } as unknown as SensitiveDataUser)
    );

    expect(screen.queryByText(NOTE)).toBeNull();
  });

  it('keeps the preview hint for a preview link opened without a login', () => {
    window.history.replaceState(null, '', '/a/foobar?preview');

    render(withProviders(<ContentUnavailable />));

    expect(screen.getByText('Vorschau nicht verfügbar')).toBeDefined();
    expect(screen.queryByText(NOTE)).toBeNull();
  });
});
