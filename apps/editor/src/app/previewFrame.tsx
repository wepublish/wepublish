import styled from '@emotion/styled';
import {
  CircularProgress,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconType } from 'react-icons';
import {
  MdContentCopy,
  MdDesktopWindows,
  MdOpenInNew,
  MdPhoneIphone,
  MdTabletMac,
} from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';

import {
  openPreviewWindow,
  OpenPreviewOptions,
  startPreviewHandshake,
} from './openPreview';

const PreviewWrapper = styled('div', {
  shouldForwardProp: propName => propName !== 'device',
})<{ device: PreviewDevice }>`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: ${({ device }) =>
    device === 'desktop' ? 'calc(100vh - 180px)' : 'auto'};
  min-height: 500px;
`;

export type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

const PREVIEW_PARAM = 'preview';
const DEFAULT_DEVICE: PreviewDevice = 'desktop';

const isPreviewDevice = (value: string | null): value is PreviewDevice =>
  value === 'mobile' || value === 'tablet' || value === 'desktop';

export const editorPreviewLink = (editorUrl: string, device: PreviewDevice) => {
  const url = new URL(editorUrl);
  url.searchParams.set(PREVIEW_PARAM, device);
  url.hash = '';

  return url.toString();
};

export const usePreviewState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get(PREVIEW_PARAM);
  const isPreviewOpen = param !== null;
  const device = isPreviewDevice(param) ? param : DEFAULT_DEVICE;
  const lastDevice = useRef(device);

  useEffect(() => {
    if (isPreviewOpen) {
      lastDevice.current = device;
    }
  }, [isPreviewOpen, device]);

  const setParam = useCallback(
    (value: PreviewDevice | null) =>
      setSearchParams(
        current => {
          const next = new URLSearchParams(current);

          if (value) {
            next.set(PREVIEW_PARAM, value);
          } else {
            next.delete(PREVIEW_PARAM);
          }

          return next;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  const setPreviewOpen = useCallback(
    (open: boolean) => setParam(open ? lastDevice.current : null),
    [setParam]
  );

  const setDevice = useCallback(
    (next: PreviewDevice) => setParam(next),
    [setParam]
  );

  return { isPreviewOpen, setPreviewOpen, device, setDevice };
};

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
    height: '844px',
    bezel: 12,
    radius: 36,
  },
  tablet: {
    width: '820px',
    maxWidth: 'calc(100% - 28px)',
    height: '1180px',
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
  background-color: rgb(
    from ${({ theme }) => theme.vars.palette.background.paper} r g b / 80%
  );
`;

const LoaderTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
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

  useEffect(() => {
    optionsRef.current = { createToken, onSilence };
  });

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
    <PreviewWrapper device={device}>
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
          <CircularProgress size={40} />
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
  gap: 4px;
`;

export type PreviewControlsProps = {
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  previewUrl: string;
  className?: string;
} & OpenPreviewOptions;

export function PreviewControls({
  device,
  onDeviceChange,
  previewUrl,
  className,
  createToken,
  onSilence,
}: PreviewControlsProps) {
  const { t } = useTranslation();

  const copyPreviewUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        editorPreviewLink(window.location.href, device)
      );

      enqueueSnackbar(t('preview.urlCopied'), {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } catch {
      enqueueSnackbar(t('preview.urlCopyFailed'), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    }
  };

  const openInNewTab = () => {
    if (
      openPreviewWindow(previewUrl, { createToken, onSilence }) ===
      'popup-blocked'
    ) {
      enqueueSnackbar(t('previewHandshake.popupBlocked'), {
        variant: 'warning',
        autoHideDuration: 8000,
      });
    }
  };

  return (
    <PreviewControlsWrapper className={className}>
      <ToggleButtonGroup
        exclusive
        value={device}
        onChange={(_event, next) => next && onDeviceChange(next)}
      >
        {devices.map(({ device: option, Icon }) => (
          <ToggleButton
            key={option}
            value={option}
            title={t(`preview.${option}`)}
            aria-label={t(`preview.${option}`)}
          >
            <Icon />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <IconButton
        title={t('preview.copyUrl')}
        aria-label={t('preview.copyUrl')}
        onClick={copyPreviewUrl}
      >
        <MdContentCopy />
      </IconButton>

      <IconButton
        title={t('preview.openInNewTab')}
        aria-label={t('preview.openInNewTab')}
        onClick={openInNewTab}
      >
        <MdOpenInNew />
      </IconButton>
    </PreviewControlsWrapper>
  );
}
