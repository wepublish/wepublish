import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { Loader } from 'rsuite';

import { OpenPreviewOptions, startPreviewHandshake } from './openPreview';

const PreviewWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(100vh - 180px);
  min-height: 500px;
`;

const Frame = styled('iframe', {
  shouldForwardProp: propName => propName !== 'mobile',
})<{ mobile: boolean }>`
  width: ${({ mobile }) => (mobile ? '390px' : '100%')};
  height: ${({ mobile }) => (mobile ? 'min(844px, 100%)' : '100%')};
  border: ${({ mobile }) => (mobile ? '12px solid #222' : '1px solid #e5e5ea')};
  border-radius: ${({ mobile }) => (mobile ? '36px' : '6px')};
  box-shadow: ${({ mobile }) =>
    mobile ? '0 10px 30px rgba(0, 0, 0, 0.25)' : 'none'};
  background-color: white;
  box-sizing: content-box;
`;

const LoaderOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
`;

export type PreviewFrameProps = {
  previewUrl: string;
  mobile: boolean;
  title: string;
} & OpenPreviewOptions;

export function PreviewFrame({
  previewUrl,
  mobile,
  title,
  createToken,
  onSilence,
}: PreviewFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setLoading] = useState(true);
  const optionsRef = useRef<OpenPreviewOptions>({ createToken, onSilence });
  optionsRef.current = { createToken, onSilence };

  useEffect(() => {
    const frameWindow = frameRef.current?.contentWindow;

    if (!frameWindow) {
      return;
    }

    return startPreviewHandshake(frameWindow, previewUrl, {
      createToken: () => optionsRef.current.createToken(),
      onSilence: () => optionsRef.current.onSilence?.(),
    });
  }, [previewUrl]);

  return (
    <PreviewWrapper>
      <Frame
        ref={frameRef}
        src={previewUrl}
        title={title}
        mobile={mobile}
        onLoad={() => setLoading(false)}
      />

      {isLoading && (
        <LoaderOverlay>
          <Loader size="lg" />
        </LoaderOverlay>
      )}
    </PreviewWrapper>
  );
}
