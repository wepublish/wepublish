import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { usePreviewAuthState } from './use-preview-auth-state';

const SESSION_SWAP_DELAY = '15s';
const HANDSHAKE_SWAP_DELAY = '30s';

export const PreviewStatusBannerWrapper = styled('div')`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.snackbar};
  display: grid;
  justify-items: center;
  background: rgba(0, 0, 0, 0.88);
  color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(1.5)}
    ${({ theme }) => theme.spacing(2)};
  text-align: center;
  font-size: 0.9375rem;

  a {
    color: inherit;
  }
`;

const BannerPending = styled('div', {
  shouldForwardProp: prop => prop !== 'swapDelay',
})<{ swapDelay: string }>`
  grid-area: 1 / 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  animation: preview-banner-pending-out 200ms linear
    ${({ swapDelay }) => swapDelay} forwards;

  @keyframes preview-banner-pending-out {
    to {
      opacity: 0;
      visibility: hidden;
    }
  }
`;

const BannerHint = styled('div')`
  grid-area: 1 / 1;
`;

const BannerHintDelayed = styled(BannerHint, {
  shouldForwardProp: prop => prop !== 'swapDelay',
})<{ swapDelay: string }>`
  opacity: 0;
  visibility: hidden;
  animation: preview-banner-hint-in 200ms linear ${({ swapDelay }) => swapDelay}
    forwards;

  @keyframes preview-banner-hint-in {
    to {
      opacity: 1;
      visibility: visible;
    }
  }
`;

const BannerHintContent = () => {
  const {
    elements: { Link },
  } = useWebsiteBuilder();

  return (
    <>
      Du siehst die ver&ouml;ffentlichte Version, nicht die Vorschau. F&uuml;r
      die Vorschau im Editor &ouml;ffnen oder{' '}
      <Link href="/login">anmelden</Link> und neu laden.
    </>
  );
};

export function PreviewStatusBanner() {
  const {
    previewRequested,
    canPreview,
    editorAuthPossible,
    sessionAuthPossible,
  } = usePreviewAuthState();

  if (!previewRequested || canPreview) {
    return null;
  }

  if (!editorAuthPossible && !sessionAuthPossible) {
    return (
      <PreviewStatusBannerWrapper role="status">
        <BannerHint>
          <BannerHintContent />
        </BannerHint>
      </PreviewStatusBannerWrapper>
    );
  }

  const swapDelay =
    editorAuthPossible ? HANDSHAKE_SWAP_DELAY : SESSION_SWAP_DELAY;

  return (
    <PreviewStatusBannerWrapper role="status">
      <BannerPending swapDelay={swapDelay}>
        <CircularProgress
          size={16}
          color="inherit"
        />
        Vorschau wird geladen &hellip;
      </BannerPending>

      <BannerHintDelayed swapDelay={swapDelay}>
        <BannerHintContent />
      </BannerHintDelayed>
    </PreviewStatusBannerWrapper>
  );
}
