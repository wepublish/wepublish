import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { AuthTokenStorageKey } from '@wepublish/authentication/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { getCookie } from 'cookies-next';
import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => undefined;

const useHasMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

export const PreviewUnavailableWrapper = styled('div')`
  grid-column: 1 / -1;
  display: grid;
  justify-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing(8)} ${({ theme }) => theme.spacing(2)};
`;

const PreviewPending = styled('div')`
  grid-area: 1 / 1;
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  animation: preview-pending-out 200ms linear 30s forwards;

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

const PreviewHintDelayed = styled(PreviewHint)`
  opacity: 0;
  visibility: hidden;
  animation: preview-hint-in 200ms linear 30s forwards;

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
  const {
    elements: { Paragraph },
  } = useWebsiteBuilder();

  if (
    !hasMounted ||
    !new URLSearchParams(window.location.search).has('preview')
  ) {
    return null;
  }

  const hasAuthSource = !!window.opener || !!getCookie(AuthTokenStorageKey);

  if (!hasAuthSource) {
    return (
      <PreviewUnavailableWrapper>
        <PreviewHint>
          <PreviewHintContent />
        </PreviewHint>
      </PreviewUnavailableWrapper>
    );
  }

  return (
    <PreviewUnavailableWrapper>
      <PreviewPending>
        <CircularProgress size={24} />

        <Paragraph>Vorschau wird geladen &hellip;</Paragraph>
      </PreviewPending>

      <PreviewHintDelayed>
        <PreviewHintContent />
      </PreviewHintDelayed>
    </PreviewUnavailableWrapper>
  );
}
