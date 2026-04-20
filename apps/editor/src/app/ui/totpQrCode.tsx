import styled from '@emotion/styled';
import QRCodeStyling from 'qr-code-styling';
import { useEffect, useMemo, useRef } from 'react';

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 16px 0;

  & > div {
    border-radius: 12px;
    overflow: hidden;
  }
`;

export function TotpQrCode({ uri }: { uri: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const qr = useMemo(
    () =>
      new QRCodeStyling({
        width: 220,
        height: 220,
        type: 'svg',
        data: uri,
        margin: 8,
        qrOptions: { errorCorrectionLevel: 'M' },
        dotsOptions: { type: 'rounded', color: '#1a1a1a' },
        cornersSquareOptions: { type: 'extra-rounded', color: '#1a1a1a' },
        cornersDotOptions: { type: 'dot', color: '#1a1a1a' },
        backgroundOptions: { color: '#ffffff' },
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
      <div ref={ref} />
    </Wrapper>
  );
}
