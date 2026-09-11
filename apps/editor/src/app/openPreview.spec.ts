import type { MockInstance } from 'vitest';

import {
  openPreviewWindow,
  PREVIEW_JWT_READY_MESSAGE,
  PREVIEW_JWT_RECEIVED_MESSAGE,
} from './openPreview';

const PREVIEW_URL = 'https://example.com/a/test?preview';

const flushPromises = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
};

const sendMessage = (source: unknown, data: unknown) => {
  const event = new MessageEvent('message', { data });
  Object.defineProperty(event, 'source', { value: source });
  window.dispatchEvent(event);
};

describe('openPreviewWindow', () => {
  let previewWindow: { postMessage: ReturnType<typeof vi.fn>; closed: boolean };
  let openSpy: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    previewWindow = { postMessage: vi.fn(), closed: false };
    openSpy = vi
      .spyOn(window, 'open')
      .mockReturnValue(previewWindow as unknown as Window);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    openSpy.mockRestore();
  });

  it('returns popup-blocked when the window could not be opened', () => {
    openSpy.mockReturnValue(null);
    const createToken = vi.fn();

    expect(openPreviewWindow(PREVIEW_URL, { createToken })).toBe(
      'popup-blocked'
    );
    expect(createToken).not.toHaveBeenCalled();
  });

  it('answers a ready ping with the token, scoped to the preview origin', async () => {
    const createToken = vi.fn().mockResolvedValue('token-1');

    expect(openPreviewWindow(PREVIEW_URL, { createToken })).toBe('opened');

    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    expect(previewWindow.postMessage).toHaveBeenCalledWith(
      { previewJwt: 'token-1' },
      'https://example.com'
    );
  });

  it('answers repeated pings without re-minting a fresh token', async () => {
    const createToken = vi.fn().mockResolvedValue('token-1');
    openPreviewWindow(PREVIEW_URL, { createToken });

    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    expect(previewWindow.postMessage).toHaveBeenCalledTimes(2);
    expect(createToken).toHaveBeenCalledTimes(1);
  });

  it('mints a fresh token when the previous one is about to expire', async () => {
    const createToken = vi
      .fn()
      .mockResolvedValueOnce('token-1')
      .mockResolvedValueOnce('token-2');
    openPreviewWindow(PREVIEW_URL, { createToken });

    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    vi.setSystemTime(50_000);
    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    expect(createToken).toHaveBeenCalledTimes(2);
    expect(previewWindow.postMessage).toHaveBeenLastCalledWith(
      { previewJwt: 'token-2' },
      'https://example.com'
    );
  });

  it('stops answering after the acknowledgement message', async () => {
    const createToken = vi.fn().mockResolvedValue('token-1');
    openPreviewWindow(PREVIEW_URL, { createToken });

    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();
    sendMessage(previewWindow, PREVIEW_JWT_RECEIVED_MESSAGE);
    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    expect(previewWindow.postMessage).toHaveBeenCalledTimes(1);
  });

  it('ignores messages from other windows', async () => {
    const createToken = vi.fn().mockResolvedValue('token-1');
    openPreviewWindow(PREVIEW_URL, { createToken });

    sendMessage({ some: 'other window' }, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();

    expect(previewWindow.postMessage).not.toHaveBeenCalled();
  });

  it('reports silence when no ping arrives in time', () => {
    const createToken = vi.fn().mockResolvedValue('token-1');
    const onSilence = vi.fn();
    openPreviewWindow(PREVIEW_URL, { createToken, onSilence });

    vi.advanceTimersByTime(30_000);

    expect(onSilence).toHaveBeenCalled();
  });

  it('does not report silence when a ping arrived', async () => {
    const createToken = vi.fn().mockResolvedValue('token-1');
    const onSilence = vi.fn();
    openPreviewWindow(PREVIEW_URL, { createToken, onSilence });

    sendMessage(previewWindow, PREVIEW_JWT_READY_MESSAGE);
    await flushPromises();
    vi.advanceTimersByTime(30_000);

    expect(onSilence).not.toHaveBeenCalled();
  });
});
