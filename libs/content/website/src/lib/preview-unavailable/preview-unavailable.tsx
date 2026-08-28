import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import {
  AuthTokenStorageKey,
  getPreviewHandshakeState,
  SessionTokenContext,
  subscribeToPreviewHandshake,
} from '@wepublish/authentication/website';
import { CanPreview } from '@wepublish/permissions';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { getCookie } from 'cookies-next';
import { useContext, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => undefined;

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

// A session cookie resolves within a few roundtrips; only the editor
// handshake justifies waiting for its full window.
const SESSION_SWAP_DELAY = '15s';
const HANDSHAKE_SWAP_DELAY = '30s';

export const PreviewUnavailableWrapper = styled('div')`
  grid-column: 1 / -1;
  display: grid;
  justify-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing(8)} ${({ theme }) => theme.spacing(2)};
`;

const PreviewPending = styled('div', {
  shouldForwardProp: prop => prop !== 'swapDelay',
})<{ swapDelay: string }>`
  grid-area: 1 / 1;
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  animation: preview-pending-out 200ms linear ${({ swapDelay }) => swapDelay}
    forwards;

  @keyframes preview-pending-out {
    to {
      opacity: 0;
      visibility: hidden;
    }
  }
`;

const PreviewHint = styled('div')`
  grid-area: 1 / 1;
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const PreviewHintDelayed = styled(PreviewHint, {
  shouldForwardProp: prop => prop !== 'swapDelay',
})<{ swapDelay: string }>`
  opacity: 0;
  visibility: hidden;
  animation: preview-hint-in 200ms linear ${({ swapDelay }) => swapDelay}
    forwards;

  @keyframes preview-hint-in {
    to {
      opacity: 1;
      visibility: visible;
    }
  }
`;

const PreviewHintContent = () => {
  const {
    elements: { H5, Paragraph, Link },
  } = useWebsiteBuilder();

  return (
    <>
      <H5 component="h1">Vorschau nicht verf&uuml;gbar</H5>

      <Paragraph>
        Diese Vorschau kann nur mit einer berechtigten Anmeldung angezeigt
        werden. &Ouml;ffne die Vorschau direkt aus dem Editor oder{' '}
        <Link href="/login">melde dich an</Link> und lade die Seite danach neu.
      </Paragraph>
    </>
  );
};

export function PreviewUnavailable() {
  const hasMounted = useHasMounted();
  const handshake = usePreviewHandshakeState();
  const sessionContext = useContext(SessionTokenContext);
  const user = sessionContext?.[0];
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  if (
    !hasMounted ||
    !new URLSearchParams(window.location.search).has('preview')
  ) {
    return null;
  }

  const missingPermission = !!user && !user.permissions.includes(CanPreview.id);
  const editorAuthPossible =
    !!window.opener &&
    (handshake === 'pending' || handshake === 'unknown') &&
    performance.now() < HANDSHAKE_WINDOW_MS;
  const sessionAuthPossible =
    !missingPermission && !!getCookie(AuthTokenStorageKey);

  if (!editorAuthPossible && !sessionAuthPossible) {
    return (
      <PreviewUnavailableWrapper>
        <PreviewHint>
          <PreviewHintContent />
        </PreviewHint>
      </PreviewUnavailableWrapper>
    );
  }

  const swapDelay =
    editorAuthPossible ? HANDSHAKE_SWAP_DELAY : SESSION_SWAP_DELAY;

  return (
    <PreviewUnavailableWrapper>
      <PreviewPending swapDelay={swapDelay}>
        <CircularProgress size={24} />

        <Paragraph>Vorschau wird geladen &hellip;</Paragraph>
      </PreviewPending>

      <PreviewHintDelayed swapDelay={swapDelay}>
        <PreviewHintContent />
      </PreviewHintDelayed>
    </PreviewUnavailableWrapper>
  );
}
