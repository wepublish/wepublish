import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  MdContentCopy,
  MdDesktopWindows,
  MdPhoneIphone,
  MdTabletMac,
} from 'react-icons/md';
import { ButtonGroup, IconButton, Loader, Message, toaster } from 'rsuite';

import { OpenPreviewOptions, startPreviewHandshake } from './openPreview';

const PreviewWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: calc(100vh - 180px);
  min-height: 500px;
`;

export type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

type DeviceStyle = {
  width: string;
  maxWidth: string;
  height: string;
  bezel: number;
  radius: number;
};

const deviceStyles: Record<PreviewDevice, DeviceStyle> = {
  mobile: {
    width: '390px',
    maxWidth: 'calc(100% - 24px)',
    height: 'min(844px, calc(100% - 24px))',
    bezel: 12,
    radius: 36,
  },
  tablet: {
    width: '820px',
    maxWidth: 'calc(100% - 28px)',
    height: 'min(1180px, calc(100% - 28px))',
    bezel: 14,
    radius: 24,
  },
  desktop: {
    width: 'calc(100% - 24px)',
    maxWidth: 'calc(100% - 24px)',
    height: 'calc(100% - 24px)',
    bezel: 12,
    radius: 12,
  },
};

const Frame = styled('iframe', {
  shouldForwardProp: propName => propName !== 'device',
})<{ device: PreviewDevice }>`
  width: ${({ device }) => deviceStyles[device].width};
  max-width: ${({ device }) => deviceStyles[device].maxWidth};
  height: ${({ device }) => deviceStyles[device].height};
  border: ${({ device }) => deviceStyles[device].bezel}px solid #222;
  border-radius: ${({ device }) => deviceStyles[device].radius}px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  background-color: white;
  box-sizing: content-box;
`;

const LoaderOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  background-color: rgb(from var(--rs-bg-card) r g b / 80%);
`;

const LoaderTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--rs-text-secondary, #8e8e93);
`;

export type PreviewFrameProps = {
  previewUrl: string;
  device: PreviewDevice;
  title: string;
} & OpenPreviewOptions;

export function PreviewFrame({
  previewUrl,
  device,
  title,
  createToken,
  onSilence,
}: PreviewFrameProps) {
  const { t } = useTranslation();
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
        device={device}
        onLoad={() => setLoading(false)}
      />

      {isLoading && (
        <LoaderOverlay>
          <LoaderTitle>{t('preview.loading')}</LoaderTitle>
          <Loader size="lg" />
        </LoaderOverlay>
      )}
    </PreviewWrapper>
  );
}

const devices: { device: PreviewDevice; Icon: IconType }[] = [
  { device: 'mobile', Icon: MdPhoneIphone },
  { device: 'tablet', Icon: MdTabletMac },
  { device: 'desktop', Icon: MdDesktopWindows },
];

const PreviewControlsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

export type PreviewControlsProps = {
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  previewUrl: string;
  className?: string;
};

export function PreviewControls({
  device,
  onDeviceChange,
  previewUrl,
  className,
}: PreviewControlsProps) {
  const { t } = useTranslation();

  const copyPreviewUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);

      toaster.push(
        <Message
          type="success"
          showIcon
          closable
          duration={3000}
        >
          {t('preview.urlCopied')}
        </Message>
      );
    } catch {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={8000}
        >
          {t('preview.urlCopyFailed')}
        </Message>
      );
    }
  };

  return (
    <PreviewControlsWrapper className={className}>
      <ButtonGroup>
        {devices.map(({ device: option, Icon }) => (
          <IconButton
            key={option}
            size="lg"
            icon={<Icon />}
            appearance={option === device ? 'primary' : 'default'}
            active={option === device}
            title={t(`preview.${option}`)}
            aria-label={t(`preview.${option}`)}
            aria-pressed={option === device}
            onClick={() => onDeviceChange(option)}
          />
        ))}
      </ButtonGroup>

      <IconButton
        size="lg"
        icon={<MdContentCopy />}
        title={t('preview.copyUrl')}
        aria-label={t('preview.copyUrl')}
        onClick={copyPreviewUrl}
      />
    </PreviewControlsWrapper>
  );
}
