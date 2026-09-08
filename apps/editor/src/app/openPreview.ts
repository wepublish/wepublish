export const PREVIEW_JWT_READY_MESSAGE = 'preview-jwt-ready';
export const PREVIEW_JWT_RECEIVED_MESSAGE = 'preview-jwt-received';

const TOKEN_MAX_AGE_MS = 45_000;
const SILENCE_TIMEOUT_MS = 30_000;
const HANDSHAKE_TIMEOUT_MS = 120_000;

export type OpenPreviewResult = 'opened' | 'popup-blocked';

export type OpenPreviewOptions = {
  createToken: () => Promise<string | null | undefined>;
  onSilence?: () => void;
};

export const openPreviewWindow = (
  previewUrl: string,
  { createToken, onSilence }: OpenPreviewOptions
): OpenPreviewResult => {
  const previewWindow = window.open(previewUrl, '_blank');

  if (!previewWindow) {
    return 'popup-blocked';
  }

  const targetOrigin = new URL(previewUrl).origin;

  let token: string | undefined;
  let mintedAt = 0;
  let minting: Promise<string | undefined> | null = null;
  let pinged = false;

  const freshToken = () => {
    if (token && Date.now() - mintedAt < TOKEN_MAX_AGE_MS) {
      return Promise.resolve(token);
    }

    if (!minting) {
      minting = createToken()
        .then(newToken => {
          minting = null;

          if (newToken) {
            token = newToken;
            mintedAt = Date.now();
          }

          return newToken ?? undefined;
        })
        .catch(() => {
          minting = null;

          return undefined;
        });
    }

    return minting;
  };

  const cleanup = () => {
    window.removeEventListener('message', handleMessage);
    clearTimeout(silenceTimeout);
    clearTimeout(handshakeTimeout);
  };

  const handleMessage = async (event: MessageEvent) => {
    if (event.source !== previewWindow) {
      return;
    }

    if (event.data === PREVIEW_JWT_READY_MESSAGE) {
      pinged = true;
      const currentToken = await freshToken();

      if (currentToken) {
        previewWindow.postMessage({ previewJwt: currentToken }, targetOrigin);
      }
    }

    if (event.data === PREVIEW_JWT_RECEIVED_MESSAGE) {
      cleanup();
    }
  };

  window.addEventListener('message', handleMessage);

  const silenceTimeout = setTimeout(() => {
    if (!pinged && !previewWindow.closed) {
      onSilence?.();
    }
  }, SILENCE_TIMEOUT_MS);

  const handshakeTimeout = setTimeout(cleanup, HANDSHAKE_TIMEOUT_MS);

  void freshToken();

  return 'opened';
};
