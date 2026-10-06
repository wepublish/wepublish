import styled from '@emotion/styled';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useMemo, useRef } from 'react';
import markUrl from './wepublish-mark.png';

// Next's image loader resolves a `.png` import to `{ src, width, height }`,
// Vite resolves it to a plain URL string. This lib is consumed by both, so
// normalise instead of assuming either shape.
const markSrc: string =
  typeof markUrl === 'string' ? markUrl : (markUrl as { src: string }).src;

const Wrapper = styled('div')`
  display: flex;
  justify-content: center;

  & > div {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
`;

export function TotpQrCode({ uri }: { uri: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const qr = useMemo(
    () =>
      new QRCodeStyling({
        width: 240,
        height: 240,
        type: 'svg',
        data: uri,
        margin: 10,
        image: markSrc,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { type: 'extra-rounded', color: '#000000' },
        cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
        cornersDotOptions: { type: 'dot', color: '#000000' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { margin: 0, imageSize: 0.4, hideBackgroundDots: true },
      }),
    [uri]
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.innerHTML = '';
    qr.append(node);
  }, [qr]);

  return (
    <Wrapper>
      <div
        ref={ref}
        data-sentry-block
      />
    </Wrapper>
  );
}
