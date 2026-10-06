import {
  AuthTokenStorageKey,
  getPreviewHandshakeState,
  getPreviewHost,
  isFramed,
  SessionTokenContext,
  subscribeToPreviewHandshake,
} from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { PREVIEW_MODE_KEY } from '@wepublish/website/admin';
import { getCookie } from 'cookies-next';
import { useContext, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => undefined;

const readPreviewModeStored = () => {
  try {
    return !!Number(window.sessionStorage.getItem(PREVIEW_MODE_KEY));
  } catch {
    return false;
  }
};

const hasFramedSession = () => {
  try {
    return isFramed() && !!window.sessionStorage.getItem(AuthTokenStorageKey);
  } catch {
    return false;
  }
};

const useHasMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

const usePreviewHandshakeState = () =>
  useSyncExternalStore(
    subscribeToPreviewHandshake,
    getPreviewHandshakeState,
    () => 'unknown' as const
  );

// The editor handshake pings only during the first ~30s after page load, so
// an opener can deliver authentication only within that window - and once it
// has settled (succeeded or failed) nothing can arrive anymore either way.
const HANDSHAKE_WINDOW_MS = 35_000;

export type PreviewAuthState = {
  mounted: boolean;
  previewRequested: boolean;
  previewModeStored: boolean;
  canPreview: boolean;
  editorAuthPossible: boolean;
  sessionAuthPossible: boolean;
};

export const usePreviewAuthState = (): PreviewAuthState => {
  const hasMounted = useHasMounted();
  const handshake = usePreviewHandshakeState();
  const sessionContext = useContext(SessionTokenContext);
  const user = sessionContext?.[0];
  const hasToken = !!sessionContext?.[1];

  if (!hasMounted) {
    return {
      mounted: false,
      previewRequested: false,
      previewModeStored: false,
      canPreview: false,
      editorAuthPossible: false,
      sessionAuthPossible: false,
    };
  }

  const previewRequested = new URLSearchParams(window.location.search).has(
    'preview'
  );
  const canPreview = !!user && user.permissions.includes(CanPreview.id);
  const missingPermission = !!user && !canPreview;
  const editorAuthPossible =
    !!getPreviewHost() &&
    (handshake === 'pending' || handshake === 'unknown') &&
    performance.now() < HANDSHAKE_WINDOW_MS;
  const sessionAuthPossible =
    !missingPermission &&
    (hasToken || !!getCookie(AuthTokenStorageKey) || hasFramedSession());

  return {
    mounted: true,
    previewRequested,
    previewModeStored: readPreviewModeStored(),
    canPreview,
    editorAuthPossible,
    sessionAuthPossible,
  };
};
