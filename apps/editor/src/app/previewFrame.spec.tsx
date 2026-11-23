import { createTheme, ThemeProvider } from '@mui/material';
// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { PropsWithChildren, ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Mock } from 'vitest';

import {
  openPreviewWindow,
  OpenPreviewOptions,
  startPreviewHandshake,
} from './openPreview';
import {
  editorPreviewLink,
  PreviewControls,
  PreviewFrame,
  usePreviewState,
} from './previewFrame';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./openPreview', () => ({
  startPreviewHandshake: vi.fn(),
  openPreviewWindow: vi.fn(),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  enqueueSnackbar: vi.fn(),
}));

const PREVIEW_URL = 'https://example.com/a/test?preview';
const OTHER_PREVIEW_URL = 'https://example.com/a/other?preview';

const cleanup = vi.fn();

const handshakeOptions = (call = 0) =>
  (startPreviewHandshake as Mock).mock.calls[call][2] as OpenPreviewOptions;

const lastSnackbar = () =>
  (enqueueSnackbar as Mock).mock.calls[0] as [string, { variant: string }];

const theme = createTheme({ cssVariables: true });

const renderWithTheme = (ui: ReactNode) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('PreviewFrame', () => {
  const frameWindow = { postMessage: vi.fn() };
  const contentWindowDescriptor = Object.getOwnPropertyDescriptor(
    HTMLIFrameElement.prototype,
    'contentWindow'
  );

  beforeEach(() => {
    (startPreviewHandshake as Mock).mockImplementation(() => cleanup);
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      configurable: true,
      get: () => frameWindow,
    });
  });

  afterEach(() => {
    if (contentWindowDescriptor) {
      Object.defineProperty(
        HTMLIFrameElement.prototype,
        'contentWindow',
        contentWindowDescriptor
      );
    }
  });

  const renderFrame = (props: Partial<Parameters<typeof PreviewFrame>[0]>) =>
    renderWithTheme(
      <PreviewFrame
        previewUrl={PREVIEW_URL}
        device="mobile"
        title="Preview"
        createToken={vi.fn()}
        {...props}
      />
    );

  it('renders the preview url in an iframe', () => {
    renderFrame({});

    expect(screen.getByTitle('Preview').getAttribute('src')).toBe(PREVIEW_URL);
  });

  it.each([
    ['mobile', '390px', '844px'],
    ['tablet', '820px', '1180px'],
  ] as const)(
    'renders the %s preview at the real device size',
    (device, width, height) => {
      renderFrame({ device });

      const frame = getComputedStyle(screen.getByTitle('Preview'));

      expect(frame.width).toBe(width);
      expect(frame.height).toBe(height);
    }
  );

  it('shows a loader until the iframe has loaded', () => {
    renderFrame({});

    expect(screen.queryByText('preview.loading')).not.toBeNull();

    fireEvent.load(screen.getByTitle('Preview'));

    expect(screen.queryByText('preview.loading')).toBeNull();
  });

  it('starts the handshake with the iframe window', () => {
    renderFrame({});

    expect(startPreviewHandshake).toHaveBeenCalledTimes(1);
    expect(startPreviewHandshake).toHaveBeenCalledWith(
      frameWindow,
      PREVIEW_URL,
      expect.any(Object)
    );
  });

  it('uses the latest callbacks without restarting the handshake', async () => {
    const oldCreateToken = vi.fn();
    const oldOnSilence = vi.fn();
    const newCreateToken = vi.fn().mockResolvedValue('token-1');
    const newOnSilence = vi.fn();

    const { rerender } = renderFrame({
      createToken: oldCreateToken,
      onSilence: oldOnSilence,
    });

    rerender(
      <ThemeProvider theme={theme}>
        <PreviewFrame
          previewUrl={PREVIEW_URL}
          device="tablet"
          title="Preview"
          createToken={newCreateToken}
          onSilence={newOnSilence}
        />
      </ThemeProvider>
    );

    await expect(handshakeOptions().createToken()).resolves.toBe('token-1');
    handshakeOptions().onSilence?.();

    expect(startPreviewHandshake).toHaveBeenCalledTimes(1);
    expect(newCreateToken).toHaveBeenCalled();
    expect(newOnSilence).toHaveBeenCalled();
    expect(oldCreateToken).not.toHaveBeenCalled();
    expect(oldOnSilence).not.toHaveBeenCalled();
  });

  it('restarts the handshake when the preview url changes', () => {
    const { rerender } = renderFrame({});

    rerender(
      <ThemeProvider theme={theme}>
        <PreviewFrame
          previewUrl={OTHER_PREVIEW_URL}
          device="mobile"
          title="Preview"
          createToken={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(startPreviewHandshake).toHaveBeenCalledTimes(2);
    expect(startPreviewHandshake).toHaveBeenLastCalledWith(
      frameWindow,
      OTHER_PREVIEW_URL,
      expect.any(Object)
    );
  });

  it('stops the handshake on unmount', () => {
    const { unmount } = renderFrame({});

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('editorPreviewLink', () => {
  it('links to the current editor page with the preview opened on the device', () => {
    expect(
      editorPreviewLink(
        'https://editor.example.com/articles/edit/a1?foo=bar#x',
        'mobile'
      )
    ).toBe(
      'https://editor.example.com/articles/edit/a1?foo=bar&preview=mobile'
    );
  });

  it('replaces a preview device that is already in the url', () => {
    expect(
      editorPreviewLink(
        'https://editor.example.com/pages/edit/p1?preview=desktop',
        'tablet'
      )
    ).toBe('https://editor.example.com/pages/edit/p1?preview=tablet');
  });
});

describe('usePreviewState', () => {
  const renderPreviewState = (url: string) => {
    let location = '';

    const LocationSpy = () => {
      const { pathname, search } = useLocation();
      location = pathname + search;

      return null;
    };

    const wrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={[url]}>
        {children}
        <LocationSpy />
      </MemoryRouter>
    );

    const hook = renderHook(() => usePreviewState(), { wrapper });

    return { ...hook, location: () => location };
  };

  it('starts in the editor on the desktop device without a preview param', () => {
    const { result } = renderPreviewState('/articles/edit/a1');

    expect(result.current.isPreviewOpen).toBe(false);
    expect(result.current.device).toBe('desktop');
  });

  it('opens the preview on the device a copied preview link asks for', () => {
    const { result } = renderPreviewState('/articles/edit/a1?preview=mobile');

    expect(result.current.isPreviewOpen).toBe(true);
    expect(result.current.device).toBe('mobile');
  });

  it.each(['', 'fridge'])(
    'falls back to desktop for the preview param %j',
    value => {
      const { result } = renderPreviewState(
        `/articles/edit/a1?preview=${value}`
      );

      expect(result.current.isPreviewOpen).toBe(true);
      expect(result.current.device).toBe('desktop');
    }
  );

  it('keeps the url in sync so a reload stays in the preview', () => {
    const { result, location } = renderPreviewState(
      '/articles/edit/a1?templateId=t1'
    );

    act(() => result.current.setPreviewOpen(true));

    expect(location()).toBe('/articles/edit/a1?templateId=t1&preview=desktop');

    act(() => result.current.setDevice('tablet'));

    expect(result.current.device).toBe('tablet');
    expect(location()).toBe('/articles/edit/a1?templateId=t1&preview=tablet');

    act(() => result.current.setPreviewOpen(false));

    expect(result.current.isPreviewOpen).toBe(false);
    expect(location()).toBe('/articles/edit/a1?templateId=t1');
  });
});

describe('PreviewControls', () => {
  const writeText = vi.fn();
  const createToken = vi.fn();
  const onSilence = vi.fn();

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    window.history.replaceState(null, '', '/articles/edit/a1');
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  const renderControls = (onDeviceChange = vi.fn()) =>
    renderWithTheme(
      <PreviewControls
        device="tablet"
        onDeviceChange={onDeviceChange}
        previewUrl={PREVIEW_URL}
        createToken={createToken}
        onSilence={onSilence}
      />
    );

  it('marks only the selected device as pressed', () => {
    renderControls();

    const pressed = (name: string) =>
      screen.getByRole('button', { name }).getAttribute('aria-pressed');

    expect(pressed('preview.mobile')).toBe('false');
    expect(pressed('preview.tablet')).toBe('true');
    expect(pressed('preview.desktop')).toBe('false');
  });

  it('switches to the clicked device', () => {
    const onDeviceChange = vi.fn();
    renderControls(onDeviceChange);

    fireEvent.click(screen.getByRole('button', { name: 'preview.desktop' }));

    expect(onDeviceChange).toHaveBeenCalledWith('desktop');
  });

  it('copies a link that opens this preview in the editor, never the bare website url', async () => {
    writeText.mockResolvedValue(undefined);
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'preview.copyUrl' }));

    await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/articles/edit/a1?preview=tablet`
    );
    expect(writeText).not.toHaveBeenCalledWith(PREVIEW_URL);
    expect(lastSnackbar()[0]).toBe('preview.urlCopied');
    expect(lastSnackbar()[1].variant).toBe('success');
  });

  it('reports when the preview url could not be copied', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'preview.copyUrl' }));

    await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalled());
    expect(lastSnackbar()[0]).toBe('preview.urlCopyFailed');
    expect(lastSnackbar()[1].variant).toBe('error');
  });

  it('opens the website preview in a new tab and hands it the login through the opener', () => {
    (openPreviewWindow as Mock).mockReturnValue('opened');
    renderControls();

    fireEvent.click(
      screen.getByRole('button', { name: 'preview.openInNewTab' })
    );

    expect(openPreviewWindow).toHaveBeenCalledWith(PREVIEW_URL, {
      createToken,
      onSilence,
    });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it('reports a blocked popup', () => {
    (openPreviewWindow as Mock).mockReturnValue('popup-blocked');
    renderControls();

    fireEvent.click(
      screen.getByRole('button', { name: 'preview.openInNewTab' })
    );

    expect(lastSnackbar()[0]).toBe('previewHandshake.popupBlocked');
    expect(lastSnackbar()[1].variant).toBe('warning');
  });
});
