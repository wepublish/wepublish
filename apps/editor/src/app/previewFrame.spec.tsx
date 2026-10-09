// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { toaster } from 'rsuite';
import type { Mock } from 'vitest';

import { OpenPreviewOptions, startPreviewHandshake } from './openPreview';
import { PreviewControls, PreviewFrame } from './previewFrame';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./openPreview', () => ({
  startPreviewHandshake: vi.fn(),
}));

vi.mock('rsuite', async importOriginal => ({
  ...(await importOriginal<typeof import('rsuite')>()),
  toaster: { push: vi.fn() },
}));

const PREVIEW_URL = 'https://example.com/a/test?preview';
const OTHER_PREVIEW_URL = 'https://example.com/a/other?preview';

const cleanup = vi.fn();

const handshakeOptions = (call = 0) =>
  (startPreviewHandshake as Mock).mock.calls[call][2] as OpenPreviewOptions;

const pushedToast = () =>
  (toaster.push as Mock).mock.calls[0][0] as ReactElement<{
    type: string;
    children: string;
  }>;

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
    render(
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
      <PreviewFrame
        previewUrl={PREVIEW_URL}
        device="tablet"
        title="Preview"
        createToken={newCreateToken}
        onSilence={newOnSilence}
      />
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
      <PreviewFrame
        previewUrl={OTHER_PREVIEW_URL}
        device="mobile"
        title="Preview"
        createToken={vi.fn()}
      />
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

describe('PreviewControls', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  const renderControls = (onDeviceChange = vi.fn()) =>
    render(
      <PreviewControls
        device="tablet"
        onDeviceChange={onDeviceChange}
        previewUrl={PREVIEW_URL}
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

  it('copies the preview url and confirms it', async () => {
    writeText.mockResolvedValue(undefined);
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'preview.copyUrl' }));

    await waitFor(() => expect(toaster.push).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith(PREVIEW_URL);
    expect(pushedToast().props.type).toBe('success');
    expect(pushedToast().props.children).toBe('preview.urlCopied');
  });

  it('reports when the preview url could not be copied', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: 'preview.copyUrl' }));

    await waitFor(() => expect(toaster.push).toHaveBeenCalled());
    expect(pushedToast().props.type).toBe('error');
    expect(pushedToast().props.children).toBe('preview.urlCopyFailed');
  });
});
