import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { usePreviewAuthState } from './use-preview-auth-state';

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
  const { previewRequested, editorAuthPossible, sessionAuthPossible } =
    usePreviewAuthState();
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  if (!previewRequested) {
    return null;
  }

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
